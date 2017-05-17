# SpecIF-to-Confluence-Importer
A plugin importing SpecIF data to Confluence in the Atlassian Connect Environment. A page is created per SpecIF object; the attributes and relations are appended.
Also there is a integrate network plugin that will represent all relations of an Object as an interactive network.
 
 Known limitations: 
 + On IE11 there is no explicit link to the space created from the specIF File. 
 + On IE11 the nodes of the graph network are not linked to the pages of the node objects.
 + After uploading the content to a new space, this space will not shown up in the list of last spaces and has to be selected the first time manual from the spaces directory or with the link from the plugin.
 + As part of confluences infrastructure it is not possible to link one page as child of multiple pages.
