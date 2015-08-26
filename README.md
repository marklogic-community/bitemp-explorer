"# bitemporal-demo
Bitemporal + MarkLogic

To clone the project when you have git installed: 
  git clone https://github.com/marklogic/bitemp-explorer.git
If not, you can download the project as ZIP file.


INSTALL INSTRUCTIONS

1. Install MarkLogic 8: https://developer.marklogic.com/products and start the server
2. Navigate to http://localhost:8000/qconsole
3. On the right bar click the down arrow and choose "import workspace"
4. Import files in folder "WorkSpace-JS" or "WorkSpace-XQuery" depending on your language preference: Javascript or XQuery
5. Download and install node.js : https://nodejs.org/download/
6. Go to command line/terminal, cd under this repo directory, do "npm install"
7. Check to see that there is no ERR
8. Configure connection in env.js or create a local-env.js, if needed. local-env.js takes the same form as env.js, but does not get committed. 
9. Deploy three REST extensions by running - "node deploy.js" -in your shell.
10. Run app with "node app.js"
11. go to http://localhost:3000/ to see a blank graph with title
12. go back to Query console and go from workspace 1 to 5, start from tab 1.

APP INSTRUCTIONS

13. Go through the workspaces, referring to the graph at localhost:3000. Note how the graph changes with document inserts and deletes from the query console. 
14. It is recommended to go through at least the first two workspaces and create one or two temporal collections before trying the features of the demo. 
15. Use the features of the home/search pages to modify/view graphs. The graph is a visual representation of bitemporal, with 2 axes representing system and valid times of a temporal document.
16. The home page dropdown menu will drop down the properties of your documents being displayed in the graph. You can select and view new properties.
17. Click boxes in the graph (which represent physical documents) to edit, view, and delete certain documents. Edit will create a new physical document. View to see the contents of a document. The delete button will cut off a system end time to the current real time, or a time that you specify. 
18. Create a document (button) from the home page to create a new logical document with its first physical document.
19. Try entering URIs into the appropriate textbox. This will display the graph to reflect the document URI. 
20. Check out the search page (upper left corner) for a full list of temporal collections. Click the 3 dropdowns and select a temporal collection and/or a system time operator and/or a valid time operator and drag the bars to select your ranges. Click the 'Run Query' button to display the documents specified by the temporal collection and the operators/time ranges.
21. If a lot is new or confusing, look for highlighted words on the page for hovering over. A definition will pop up to help you cement your knowledge of bitemporal.


Guide to Workspaces:

MLW1-configure&basics.xml - set up temporal axis/collection, basic intro to MarkLogic

MLW2-Ingestion&Query.xml - temporal insert/update/delete examples and exercises, work together with node app on port 3000

MLW3-BitemporalTradeStore.xml - more complex data set (a trade store) exercises

MW4-Semantics.xml - intro to how bitemporal and semantics work together

MLW5-BitemporalLSQT.xml - special use case, proceed when done with 1 to 3

MLW6-IngestYourOwn - some helper code to ingest your own data


Documentation - Temporal Developer's Guide http://pubs.marklogic.com:8011/guide/temporal

