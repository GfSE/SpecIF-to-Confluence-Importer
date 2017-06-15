# SpecIF-to-Confluence-Importer

A plugin importing SpecIF data to Confluence in the Atlassian Connect Environment. A page is created per SpecIF object; the attributes and relations are appended.
Also there is a integrate network plugin that will represent all relations of an Object as an interactive network.
 
 ![Example](/Example.jpg)
 
## Setup

To use the plugin on confluence you have to provide the files in the internet and update the atlassian-connect.json with your url to this folder.

```json
  ...
    "description": "Imports any SpecIF formatted data.",
    "baseUrl": "<YOUR_URL>"
     "vendor": {
  ...  
```
Then, as admin in Confluence go to Administration -> Add-ons -> choose Upload add-on and paste <YOUR_URL> + atlassian-connect.json in the url field and begin the SpecIF upload. Now you can go to the Dashboard by clicking on Confluence and you can see the button on the right lower side. 
 
## Known limitations
 + ECMA-6 is being used and as a consequence, IE10 and below are not supported.
 + When using IE11, there is no explicit link to the space created from the specIF File. 
 + When using IE11, the nodes of the graph network are not linked to the pages of the node objects.
 + After uploading the SpecIF content to a new Confluence space, this space will not show up in the list of last spaces. The first time the created space has to be selected manually from the spaces directory or with the link shown the plugin (except IE11).
 + The Confluence architecture does not allow to use the same page as child of multiple other pages. Therefore, for each reference of an object in the SpecIF hierarchy a separate copy is created. 
 + The SpecIF type information is used to optimally display the content, but is lost as such.

## Acknowledgements
This work has been sponsored by [adesso AG](http://adesso.de), Berlin.
