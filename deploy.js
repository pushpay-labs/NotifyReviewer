const zipFolder = require('zip-folder');
const editJsonFile = require("edit-json-file");
const fs = require('fs');

const file = editJsonFile('./dist/manifest.json');
 
file.set('version', process.env.APPVEYOR_BUILD_VERSION);
file.save();
 
const folder = 'dist';
const zipName = 'extension.zip';

const REFRESH_TOKEN = process.env.REFRESH_TOKEN; 
const EXTENSION_ID = process.env.EXTENSION_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const CLIENT_ID = process.env.CLIENT_ID;

const webStore = require('chrome-webstore-upload')({
  extensionId: EXTENSION_ID,
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  refreshToken: REFRESH_TOKEN
});

// zipping the output folder
zipFolder(folder, zipName, function (err) {
  if (err) {
    console.log('oh no!', err);
    process.exit(1);
  } else {
    console.log(`Successfully Zipped ${folder} and saved as ${zipName}`);
    uploadZip(); // on successful zipping, call upload 
  }
});

function uploadZip() {
  // creating file stream to upload
  const extensionSource = fs.createReadStream(`./${zipName}`);

  // upload the zip to webstore
  webStore.uploadExisting(extensionSource).then(res => {
    console.log('Successfully uploaded the ZIP');

    // publish the uploaded zip
    webStore.publish().then(res => {
      console.log('Successfully published the newer version');
    }).catch((error) => {
      console.log(`Error while publishing uploaded extension: ${error}`);
      process.exit(1);
    });

  }).catch((error) => {
    console.log(`Error while uploading ZIP: ${error}`);
    process.exit(1);
  });
}
