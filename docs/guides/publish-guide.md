# Databus Data Publishing Guide

## About this guide
This guide walks you through the process of publishing data in the Databus.

## What will you learn
You will learn different ways publishing data in the Databus. We will cover how to:

* Step 1: Prepare Your Data
  * Option 1: Github
  * Option 2: Google Drive
  * Option 3: Any other storage providing static file download URIs
* Step 2: Publish Your Data Using GUI

## What you need
* Not more than 15 min of time for each technique
* Favorite text editor or IDE
* Terminal (console) with Unix capabilities

### Step 1: Prepare your Data

DBpedia Databus is the file metadata storage, but it does not store the data itself, so the first step for using databus would be publishing you data files in some data storage. Databus keeps the file download URIs, so the storage you use must be able to provide them. 

**!!!NOTE!!! The URIs must be [permanent links](https://en.wikipedia.org/wiki/Permalink) and the data to which they point must be static (not editable) because Databus stores checksums of the files and changing underlying data will break the checksums.**

#### Github

You may store your data in a Github repository. To publish it in Databus you simply obtain permanent links to the files.

To get permanent links you need to switch to repository version of particular commit:

![publish-guide-1.png](..%2Fimages%2Fpublish-guide-1.png)

then:

![publish-guide-2.png](..%2Fimages%2Fpublish-guide-2.png)

and then copy raw links to file data:

![publish-guide-3.png](..%2Fimages%2Fpublish-guide-3.png)

For example a link to our readme as of July 2023 will be: [https://raw.githubusercontent.com/dbpedia/databus/68f976e29e2db15472f1b664a6fd5807b88d1370/README.md](https://raw.githubusercontent.com/dbpedia/databus/68f976e29e2db15472f1b664a6fd5807b88d1370/README.md)

**!NOTE! If you use links referring not to commit, but to branch, the files there may be changing over time, which will break corrspondence with the file hashes stored in Databus**

#### Google Drive

Google Drive does not provide direct download links, but you can easily generate them. Please follow the detailed instructions on this website: [https://sites.google.com/site/gdocs2direct/](https://sites.google.com/site/gdocs2direct/). 

**!NOTE! Your Google Drive files should be static. Publishing files you still edit will result in wrong files hashes in Databus.**

#### Other Storage

Please prepare file download links of the data your want to publish from any other storage in a similar way to shown above. Examples of the prossible storages: Apache or Nginx web-servers, FTP servers, IPFS, WebDav, any kind of file server, etc.

### Step 2: Publish Your Data Using GUI

Publishing your data using web-interface in Databus is very simple.

1. Log In to your account
2. Go to Publish Data hovering over your account icon.

![publish.png](..%2Fimages%2Fpublish.png)

3. Fill in the publishing form following the hints.
4. Publish!

![Publish](../images/publish-button.png)

5. After publishing, you can move on with querying the data you published using [collections](../usage/web-interface/collections.md) or also checkout out [Data Download Guide](data-download-guide.md).


## More links

You can find more in our [Data Download Guide](data-download-guide.md) or [Quickstart Examples](..%2Fusage%2Fquickstart-examples.md)
