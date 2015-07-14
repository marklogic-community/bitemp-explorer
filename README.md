"# bitemporal-demo
Bitemporal + MarkLogic

To clone the project when you have git installed: 
  git clone https://github.com/fxue/bitemporal-demo.git
If not, you can download the project as ZIP file.


INSTALL INSTRUCTIONS

1. Install MarkLogic 8: https://developer.marklogic.com/products and start the server
2. Navigate to http://localhost:8000/qconsole
3. On the right bar click the down arrow and choose "import workspace"
4. Import files in folder "WorkSpace-JS" or "WorkSpace-XQuery" depending on your language preference: Javascript or XQuery
5. Download and install node.js : https://nodejs.org/download/
6. Go to command line/terminal, cd under this repo directory, do "npm install"
7. Check to see that there is no ERR
8. Configure connection in env.js if needed.
10. Run app with "node app.js"
11. go to http://localhost:3000/ to see a blank graph with title
12. go back to Query console and go from workspace 1 to 5, start from tab 1.

Guide to Workspaces:

MLW1-configure&basics.xml - set up temporal axis/collection, basic intro to MarkLogic

MLW2-Ingestion&Query.xml - temporal insert/update/delete examples and exercises, work together with node app on port 3000

MLW3-BitemporalTradeStore.xml - more complex data set (a trade store) exercises

MW4-Semantics.xml - intro to how bitemporal and semantics work together

MLW5-BitemporalLSQT.xml - special use case, proceed when done with 1 to 3

MLW6-IngestYourOwn - some helper code to ingest your own data


Documentation - Temporal Developer's Guide http://pubs.marklogic.com:8011/guide/temporal



[![Join the chat at https://gitter.im/marklogic/bitemp-explorer](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/marklogic/bitemp-explorer?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)