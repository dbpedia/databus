# Model Generation:
sudo apt install php7.4-cli
php model.php > model.md

RECOMMENDED if context or shacl was changed
cat generated/context.json | jq
cd generated/shacl/
for i in `ls *.shacl` ; do rapper -gc $i  ; done

Goal:
* php script is a template to fill a markdown doc (stdout)
* also generates context, shacl (these are the Single Source of Truth SSoT files)
* OWL should be taken from dataid, dct, dcat, etc. SSoT is elsewhere

Success criteria:
* context.json, shacl have a correct syntax.
* model.md renders well and looks pretty and serves as good docu
* model.md can be viewed at github and might be converted to HTML and shipped with the bus later


