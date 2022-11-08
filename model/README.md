# Model Generation:

A small helper program to keep docu and code in sync. 
The PHP files contain templates and variables that contain docu and code. 
From these Markdown is generated and committed to git and available in gitbook: https://dbpedia.gitbook.io/databus/model/model

## Installation
```
sudo apt install php7.4-cli
cd .git/hooks
ln -s ../../.githooks/pre-commit pre-commit
```

## Updating context.json and shacl 

```
cat generated/context.json | jq
cd generated/shacl/
for i in `ls *.shacl` ; do rapper -gc $i  ; done
```

Goal:
* php script is a template to fill a markdown doc (stdout)
* also generates context, shacl (these are the Single Source of Truth SSoT files)
* OWL should be taken from dataid, dct, dcat, etc. SSoT is elsewhere

Success criteria:
* context.json, shacl have a correct syntax.
* renders well and looks pretty and serves as good docu
* can be viewed in Gitbook 


