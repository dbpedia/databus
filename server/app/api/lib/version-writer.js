const JsonldUtils = require('../../../../public/js/utils/jsonld-utils.js');
const DatabusUris = require('../../../../public/js/utils/databus-uris.js');
const Constants = require('../../common/constants.js');
const signer = require('./databus-tractate-suite.js');
const shaclTester = require('../../common/shacl-tester.js');
const jsonld = require('jsonld');
const sparql = require('../../common/queries/sparql.js');
const constructor = require('../../common/execute-construct.js');
const constructVersionQuery = require('../../common/queries/constructs/construct-version.sparql');
const autocompleter = require('./dataid-autocomplete.js');
const fileAnalyzer = require('../../common/file-analyzer.js');
const DatabusUtils = require('../../../../public/js/utils/databus-utils.js');
const ApiError = require('../../common/utils/api-error');
const ResourceWriter = require('./resource-writer.js');

/**
 * Publishes a databus:Version as dataid.jsonld.
 *
 * Pipeline (onCreateGraphs → ResourceWriter.writeResource):
 *   1. SHACL-check the registration JSON-LD (version-input.shacl)
 *   2. Project registration input → dataid graph via in-memory SPARQL CONSTRUCT
 *   3. Enrich parts, verify content variants, sign (finalizeDataidGraphs)
 *   4. [ResourceWriter] SHACL-check output (version.shacl), compact, save to gstore
 */
class VersionWriter extends ResourceWriter {

  constructor(logger, fetchFileProperties = null) {
    super(logger);
    this.fetchFileProperties = fetchFileProperties;
  }

  getDocumentFilename() {
    return Constants.DATABUS_FILE_DATAID;
  }

  getSHACLFilePath() {
    return './res/shacl/version.shacl';
  }

  async onCreateGraphs() {
    // Registration JSON-LD is checked against version-input.shacl.
    // ResourceWriter runs a second pass against version.shacl on the output below.
    var shaclResult = await shaclTester.validateVersionInputRDF(this.inputGraphs);

    if (!shaclResult.isSuccess) {
      throw new ApiError(400, this.uri, `Input validation failed`, shaclResult);
    }

    var versionGraph = JsonldUtils.getGraphById(this.inputGraphs, this.uri);
    this.logger.debug(this.uri, `Processing version <${this.uri}>`, versionGraph);

    // Build the dataid.jsonld document: one Version graph + one Part graph per file.
    //
    // Registration input already contains these graphs, but scattered across the payload.
    // executeConstruct loads a slice into an in-memory rdfstore and runs
    // construct-version.sparql, which selects and normalizes the Version, Part,
    // artifact, group, proof, and content-variant triples that belong together.
    //
    // We batch distributions (100 at a time) because attaching all of them to one
    // in-memory graph makes the CONSTRUCT query too large and slow.
    var cvGraphs = JsonldUtils.getSubPropertyGraphs(this.inputGraphs, DatabusUris.DATABUS_CONTENT_VARIANT);
    this.logger.debug(this.uri, `Detected CV-graphs`, cvGraphs);

    var distributionUris = versionGraph[DatabusUris.DCAT_DISTRIBUTION];

    // Start with a clone of the version graph; distribution refs are rebuilt below.
    var dataIdGraphs = [];
    dataIdGraphs.push(JSON.parse(JSON.stringify(versionGraph)));
    versionGraph[DatabusUris.DCAT_DISTRIBUTION] = [];

    var totalTripleCount = 0;
    var step = 100;

    // Mutable copy used to attach each distribution batch for CONSTRUCT.
    var versionGraphCopy = JSON.parse(JSON.stringify(versionGraph));
    var distributionlessGraphs = [versionGraphCopy].concat(cvGraphs);

    for (var i = 0; i < distributionUris.length; i += step) {

      var distributionSubset = distributionUris.slice(i, Math.min(distributionUris.length, i + step));
      var slice = Array.from(distributionlessGraphs);

      versionGraphCopy[DatabusUris.DCAT_DISTRIBUTION] = [];
      for (var j = 0; j < distributionSubset.length; j++) {
        versionGraphCopy[DatabusUris.DCAT_DISTRIBUTION].push(distributionSubset[j]);
        slice.push(JsonldUtils.getGraphById(this.inputGraphs, distributionSubset[j][DatabusUris.JSONLD_ID]));
      }

      var triples = await constructor.executeConstruct(slice, constructVersionQuery);
      var tripleCount = DatabusUtils.lineCount(triples);
      this.logger.debug(this.uri, `Construct fetched ${tripleCount} triples from subgraph`);

      totalTripleCount += tripleCount;

      var unflattenedJsonLd = await jsonld.fromRDF(triples);

      var subGraphs = await jsonld.flatten(unflattenedJsonLd);
      subGraphs = JsonldUtils.getTypedGraphs(subGraphs, DatabusUris.DATABUS_PART);

      // Collect Part graphs and wire them back into the version's dcat:distribution list.
      for (var subGraph of subGraphs) {
        dataIdGraphs.push(subGraph);
        var distributionGraphEntry = {};
        distributionGraphEntry[DatabusUris.JSONLD_ID] = subGraph[DatabusUris.JSONLD_ID];
        versionGraph[DatabusUris.DCAT_DISTRIBUTION].push(distributionGraphEntry);
      }
    }

    if (totalTripleCount == 0) {
      return null;
    }

    this.logger.debug(this.uri, `${totalTripleCount} triples selected via construct query.`, dataIdGraphs);

    return await this.finalizeDataidGraphs(dataIdGraphs);
  }

  /**
   * Turn the projected dataid graphs into publish-ready output.
   * Runs after CONSTRUCT, before ResourceWriter's output SHACL check and gstore write.
   */
  async finalizeDataidGraphs(graphs) {

    // Fill in missing metadata fields the publisher did not supply.
    this.logger.debug(this.uri, `Input before auto-completion`, graphs);
    autocompleter.autocomplete(graphs, this.logger);
    this.logger.debug(this.uri, `Input after auto-completion`, graphs);

    // fetch-file-properties: null/true = fetch missing props; false = skip entirely.
    this.logger.debug(this.uri, `fetch-file-properties is set to ${this.fetchFileProperties}`, null);

    if (this.fetchFileProperties == true || this.fetchFileProperties == null) {
      await this.verifyDataidParts(graphs, this.fetchFileProperties == true);
    }

    var distributionGraphs = JsonldUtils.getTypedGraphs(graphs, DatabusUris.DATABUS_PART);
    var cvGraphs = JsonldUtils.getSubPropertyGraphs(graphs, DatabusUris.DATABUS_CONTENT_VARIANT);

    // SHACL expects byteSize as xsd:decimal.
    for (var distribution of distributionGraphs) {
      if (distribution[DatabusUris.DCAT_BYTESIZE] != null && distribution[DatabusUris.DCAT_BYTESIZE].length > 0) {
        distribution[DatabusUris.DCAT_BYTESIZE][0][DatabusUris.JSONLD_TYPE] = DatabusUris.XSD_DECIMAL;
      }
    }

    // No two parts may share the same content-variant key (format + compression + custom CVs).
    var contentVariantUris = [
      DatabusUris.DATABUS_FORMAT_EXTENSION,
      DatabusUris.DATABUS_COMPRESSION,
    ];

    for (var cvGraph of cvGraphs) {
      contentVariantUris.push(cvGraph[DatabusUris.JSONLD_ID]);
    }

    var contentVariantErrors = DatabusUtils.cvSplit(distributionGraphs, contentVariantUris, 0);

    if (contentVariantErrors.length > 0) {
      throw new ApiError(400, this.uri,
        `Invalid content variant setup. Two or more files are not distinguishable by either databus:formatExtension, databus:compression or any custom content variant.`,
        contentVariantErrors);
    }

    graphs = await jsonld.flatten(graphs);
    graphs = await this.createOrValidateSignature(graphs);

    this.logger.debug(this.uri, `Signature validation successful.`, null);

    return graphs;
  }

  /**
   * Ensure every Part has file metadata (shasum, byteSize, format, compression).
   * Downloads and analyzes files when properties are missing; skipped per-part when
   * already complete unless alwaysFetch is true (fetch-file-properties=true).
   */
  async verifyDataidParts(dataidGraphs, alwaysFetch) {

    var distributions = JsonldUtils.getTypedGraphs(dataidGraphs, DatabusUris.DATABUS_PART);

    for (var distribution of distributions) {
      if (!alwaysFetch) {
        var needsFetching = false;

        needsFetching |= distribution[DatabusUris.DATABUS_FORMAT_EXTENSION] == null;
        needsFetching |= distribution[DatabusUris.DATABUS_COMPRESSION] == null;
        needsFetching |= distribution[DatabusUris.DATABUS_SHASUM] == null;
        needsFetching |= distribution[DatabusUris.DCAT_BYTESIZE] == null;

        if (!needsFetching) {
          this.logger.debug(this.uri, `File properties for part <${distribution[DatabusUris.JSONLD_ID]}> are already specified.`, distribution);
          continue;
        }
      }

      var downloadURL = distribution[DatabusUris.DCAT_DOWNLOAD_URL][0][DatabusUris.JSONLD_ID];
      var analyzeResult = await fileAnalyzer.analyzeFile(downloadURL);

      if (analyzeResult.code != 200) {
        throw new ApiError(400, this.uri, `Error analyzing file`, analyzeResult.data);
      }

      this.logger.debug(this.uri, `Analyzed part <${distribution[DatabusUris.JSONLD_ID]}>`, analyzeResult.data);

      // format/compression only filled when absent; shasum/byteSize always overwritten.
      if (distribution[DatabusUris.DATABUS_FORMAT_EXTENSION] == undefined) {
        distribution[DatabusUris.DATABUS_FORMAT_EXTENSION] = [{}];
        distribution[DatabusUris.DATABUS_FORMAT_EXTENSION][0][DatabusUris.JSONLD_VALUE]
          = analyzeResult.data.formatExtension;
      }

      if (distribution[DatabusUris.DATABUS_COMPRESSION] == undefined) {
        distribution[DatabusUris.DATABUS_COMPRESSION] = [{}];
        distribution[DatabusUris.DATABUS_COMPRESSION][0][DatabusUris.JSONLD_VALUE]
          = analyzeResult.data.compression;
      }

      distribution[DatabusUris.DATABUS_SHASUM] = [{}];
      distribution[DatabusUris.DATABUS_SHASUM][0][DatabusUris.JSONLD_VALUE] = analyzeResult.data.shasum;
      distribution[DatabusUris.DCAT_BYTESIZE] = [{}];
      distribution[DatabusUris.DCAT_BYTESIZE][0][DatabusUris.JSONLD_VALUE] = analyzeResult.data.byteSize;
      distribution[DatabusUris.DCAT_BYTESIZE][0][DatabusUris.JSONLD_TYPE] = DatabusUris.XSD_DECIMAL;
    }

    this.logger.debug(this.uri, `All parts verified`, dataidGraphs);
  }

  /**
   * Authorize the publisher and attach a valid databus tractate proof.
   *
   * - Publisher must be linked to the publishing account (SPARQL check).
   * - External publishers (not on this Databus) must supply sec:proof in the input.
   * - Local publishers get a proof auto-generated when none is present.
   */
  async createOrValidateSignature(dataidGraphs) {

    var versionGraph = JsonldUtils.getTypedGraph(dataidGraphs, DatabusUris.DATABUS_VERSION);
    var accountUri = this.resource.getAccountURI();

    var datasetPublisherUri = JsonldUtils.getFirstObjectUri(versionGraph, DatabusUris.DCT_PUBLISHER);
    this.logger.debug(this.uri, `Publishing as <${datasetPublisherUri}>.`, null);

    var isPublisherConnectedToAccount = await sparql.accounts
      .getPublisherHasAccount(datasetPublisherUri, accountUri);

    if (!isPublisherConnectedToAccount) {
      throw new ApiError(403, this.uri,
        `The specified publisher <${datasetPublisherUri}> is not linked to the account of the request issuer <${accountUri}>.`, null);
    }

    var proofId = JsonldUtils.getFirstObjectUri(versionGraph, DatabusUris.SEC_PROOF);
    var proofGraph = JsonldUtils.getGraphById(dataidGraphs, proofId);
    var generatingSignature = false;

    if (proofGraph == undefined) {

      this.logger.debug(this.uri, `No signature found in the input.`, null);

      if (!datasetPublisherUri.startsWith(process.env.DATABUS_RESOURCE_BASE_URL)) {
        throw new ApiError(400, this.uri, `Uploads using an external account need to provide a signature.`, null);
      }

      // Local publish: sign on behalf of the publisher WebID.
      this.logger.debug(this.uri, `Generating signature.`, null);
      generatingSignature = true;
      proofGraph = signer.createProof(dataidGraphs);

      this.logger.debug(this.uri, `Generated proof graph.`, proofGraph);

      versionGraph[DatabusUris.SEC_PROOF] = [proofGraph];

      dataidGraphs = await jsonld.flatten(dataidGraphs);
    }

    var proofType = JsonldUtils.getFirstObject(proofGraph, DatabusUris.JSONLD_TYPE);

    if (proofType != DatabusUris.DATABUS_TRACTATE_V1) {
      throw new ApiError(400, this.uri, `Unkown proof type <${proofType}>.`, proofType);
    }

    var validationSuccess = await signer.validate(signer.canonicalize(dataidGraphs), proofGraph);

    if (!validationSuccess) {
      if (generatingSignature) {
        throw new ApiError(500, this.uri, `Failed to generate signature. Please contact an administrator.`, null);
      }
      throw new ApiError(400, this.uri, `The provided signature was invalid.`, null);
    }

    return dataidGraphs;
  }
}

module.exports = VersionWriter;
