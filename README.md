# SpecIF-to-Confluence-Importer
A plugin importing SpecIF data to Confluence in the Atlassian Connect Environment. A page is created per SpecIF object; the attributes and relations are appended.
Also there is a integrate network plugin that will represent all relations of an Object as an interactive network.
 
 ![Example](/Example.jpg)
## Known limitations: 
 + On IE11 there is no explicit link to the space created from the specIF File. 
 + On IE11 the nodes of the graph network are not linked to the pages of the node objects.
 + After uploading the content to a new space, this space will not shown up in the list of last spaces and has to be selected the first time manual from the spaces directory or with the link from the plugin.
 + As part of confluences infrastructure it is not possible to link one page as child of multiple pages.
 
## Setup

To use the plugin on confluence you have to provide the files in the internet and update the atlassian-connect.json with your url to this folder.

```json
  ...
    "description": "Imports any SpecIF formatted data.",
    "baseUrl": "<YOUR_URL>"
     "vendor": {
  ...  
```
After this, as admin in confluence go to Administration -> Add-ons -> choose Upload add-on and paste <YOUR_URL> + atlassian-connect.json in the url field and begin the upload. Now you can go to the Dashboard by clicking on Confluence and you can see the button on the right lower side. 
