# Integration with CI (Jenkins)

In this article we briefly describe how to use DBpedia Databus with continuous integration systems like [Jenkins](https://www.jenkins.io) and provide several examples of jenkins pipelines.

## Publishing your data files (datasets) into Databus.
You can use CI tools for publishing metadata of your data into Databus. 
Here is an example of jenkins pipeline for that:

```groovy
// databus DataID template for publishing (this is a minimal version)
// here we are publishing only one file
def req(downloadUrl, username, artifact, version, licenseUrl){
    return """{
        "@context": "https://downloads.dbpedia.org/databus/context.jsonld",
        "@graph": [
        {
          "@type": "Version",
          "@id": "https://databus.dbpedia.org/${username}/jenkins/${artifact}/${version}",
          "hasVersion": "${version}",
          "title": "Test jenkins",
          "description": "Test jenkins",
          "license": "${licenseUrl}",
          "distribution": [
            {
              "@type": "Part",
              "formatExtension": "txt",
              "compression": "none",
              "downloadURL": "${downloadUrl}"
            }
          ]
        }
        ]
    }"""
}

pipeline {
    agent any
    stages {
        stage("Generate data"){
            steps{
                // we create file for demonstration purpose
                script {
                    sh "echo 'Hello World!' > 'jenkins-test-file-${BUILD_DATE}-${BUILD_NUMBER}.txt'"
                }
            }
        }
        // we transfer the file to a nginx www location, the file gets downloadable. 
        stage('SSH transfer') {
            steps([$class: 'BapSshPromotionPublisherPlugin']) {
                sshPublisher(
                    continueOnError: false, failOnError: true,
                    publishers: [
                        sshPublisherDesc(
                            configName: "nginx",
                            verbose: true,
                            transfers: [
                                sshTransfer(sourceFiles: "*.txt", remoteDirectory: "jenkins-test/${BUILD_DATE}")
                            ]
                        )
                    ]
                )
            }
        }
    // we publish the file to databus specifying its download link
    stage("Publish to Databus"){
            steps{
                script{
                    // USERNAME is your Databus username
                    withCredentials([usernamePassword(credentialsId: 'DBUS-Kikiriki', usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD')]){
                        def body = req(
                                // download uri
                                "http://test.dbpedia.org/data/jenkins-test/${BUILD_DATE}/jenkins-test-file-${BUILD_DATE}-${BUILD_NUMBER}.txt",
                                // your Databus username
                                USERNAME,
                                "jenkins",
                                // you specify this as a Databus version
                                "${BUILD_DATE}-${BUILD_NUMBER}",
                                "https://dalicc.net/licenselibrary/Apache-2.0"
                                )
                        echo """DataID: 
                        ${body}"""
                            
                            
                        def response = httpRequest  validResponseCodes: "200",
                            consoleLogResponseBody: true,  
                            httpMode: 'POST', quiet: true,
                            requestBody: body,
                         url: "https://databus.dbpedia.org/api/publish",                       
                         customHeaders:[
                             // here is you Databus Api Key
                             [name:'X-API-KEY', value: PASSWORD],
                             [name: "Content-Type", value: "application/ld+json"]
                             ]
                             
                         echo "Status: ${response.content}"
                        }
                }
            }
        }
    }
}
```

## Downloading data files (datasets) from Databus.

Here is a sample script of how to download the latest version of an artifact from Databus in a jenkins pipeline:

```groovy
// A template for SPARQL query.
// We query 1 file of the latest version of an artifact.
// !!! NOTE that it queries only one file (LIMIT 1), in our case with 1-file artifact it works  
def req(artifact){
    return """
        PREFIX dcat:   <http://www.w3.org/ns/dcat#>
        PREFIX databus: <https://dataid.dbpedia.org/databus#>
        PREFIX dct: <http://purl.org/dc/terms/>
        
        SELECT ?file WHERE
        {
                GRAPH ?g
                {
                        ?dataset databus:artifact <${artifact}> .
                        ?dataset dct:hasVersion ?v . 
                        ?dataset dcat:distribution ?distribution .
                        ?distribution databus:file ?file .
                }
        } 
        ORDER BY DESC (STR(?v)) LIMIT 1
        """
}


pipeline {
    agent any
    stages {

    stage("latest artifact file"){
        steps{
            script{
                def body = req(
                        "https://databus.dbpedia.org/kikiriki/jenkins/jenkins"
                        )
                // wrap in a json (x-www-urlencoded also works)
                def jsonBody = new groovy.json.JsonBuilder(query: body).toPrettyString()
                echo "Query is: \n${body}"
                    
                // send post http-request to a databus SPARQL endpoint 
                def response = httpRequest  validResponseCodes: "200",
                    consoleLogResponseBody: true,  
                    httpMode: 'POST', quiet: true,
                    requestBody: jsonBody,
                 url: "https://databus.dbpedia.org/sparql",                       
                 customHeaders:[
                     [name: "Content-Type", value: "application/json"],
                     [name: "Accept", value: "text/csv"]
                     ]
                 // if we configure Accept: text/csv the endpoint returns this:
                 // "file"
                 // "https://databus.dbpedia.org/kikiriki/jenkins/jenkins/2024-04-09-9/jenkins.txt"
                 echo "Response: ${response.content}"
                 // we extract the URI from the response 
                 def fn = response.content.split('\n')[1].replaceAll('"', '').trim()
                 
                 echo "Download URI: ${fn}"
                // we can use the URI to download the file using curl
                 sh "curl -O ${fn}"
            }
        }
    }
    }
    
}
```