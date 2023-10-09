const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');
const archiver = require('archiver');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.use(express.static('public', { extensions: ['html', 'css'] }));
const zipFilePath = path.join(__dirname, 'downloaded_documents', 'downloaded.zip');
app.use('/downloaded-documents', express.static(path.join(__dirname, 'downloaded_documents')));

const baseUrl = 'https://patents.tvornica.net/api';
const loginUrl = `${baseUrl}/login/`;

const accessTokenDirectory = path.join(__dirname, 'login_responses');
const accessTokenFilePath = path.join(accessTokenDirectory, 'login_response.json');

if (!fs.existsSync(accessTokenDirectory)) {
    fs.mkdirSync(accessTokenDirectory, { recursive: true });
}

const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
};

function readAccessToken() {
    try {
        const loginResponse = JSON.parse(fs.readFileSync(accessTokenFilePath, 'utf-8'));
        return loginResponse.access;
    } catch (error) {
        console.error('Error reading access token:', error.message);
        return null;
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/trigger-app-js', async (req, res) => {
    try {
        const { patentNumber, documentCodes } = req.body;

        const response = await axios.post(loginUrl, {
            email: 'swagger_patents@dev-morgancode.com',
            password: 'QppuycgwcHa9pYmpoZZe',
        });

        if (response.status === 200) {
            const accessToken = response.data.access;
            console.log('Login successful. Access token:', accessToken);

            const selectedDocumentCodes = documentCodes.split(',');

            const downloadPromises = [];

 
            for (const docCode of selectedDocumentCodes) {
                const requestData = {
                    numbers: patentNumber,
                    date_from: '1990-10-05',
                    date_to: '2023-10-05',
                    document_code: docCode,
                    desired_apps_extended_info: false,
                };

                headers.Authorization = `Bearer ${accessToken}`;

  
                downloadPromises.push(
                    axios.post(`${baseUrl}/download-available-documents/`, requestData, { headers })
                );
            }

      
            const downloadResponses = await Promise.all(downloadPromises);

     
            const downloadedFilePaths = [];

            for (let i = 0; i < downloadResponses.length; i++) {
                const response = downloadResponses[i];
                const docCode = selectedDocumentCodes[i];

                if (response.status === 200) {
                    const downloadUrl = response.data.results.download_all_documents_as_zip.url;

                  
                    const fileResponse = await axios({
                        method: 'GET',
                        url: downloadUrl,
                        responseType: 'stream',
                        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
                    });

                    const uniqueFileName = `downloaded_${docCode}.zip`;

         
                    const responseFilePath = path.join(__dirname, 'downloaded_documents', uniqueFileName);
                    const writer = fs.createWriteStream(responseFilePath);
                    fileResponse.data.pipe(writer);

                    await new Promise((resolve, reject) => {
                        writer.on('finish', resolve);
                        writer.on('error', reject);
                    });

                    downloadedFilePaths.push(responseFilePath);
                } else {
                    console.error(`Failed to retrieve documents for document code ${docCode}.`);
                }
            }

          
            const combinedZipFilePath = await combineFilesIntoZip(downloadedFilePaths);

            res.download(combinedZipFilePath, 'combined_documents.zip', (err) => {
                if (err) {
                    console.error('Error sending the combined ZIP file:', err.message);
                    res.status(500).send('Failed to send the combined ZIP file.');
                } else {
                    console.log('Combined ZIP file sent for download.');
                }
            });
        } else {
            console.error('Failed to fetch access token.');
            res.status(500).send('Failed to fetch access token.');
        }
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send(`Error: ${error.message}`);
    }
});


async function combineFilesIntoZip(filePaths) {
    const combinedZipFilePath = path.join(__dirname, 'downloaded_documents', 'combined_documents.zip');

    const archive = archiver('zip', {
        zlib: { level: 9 },
    });

    const output = fs.createWriteStream(combinedZipFilePath);
    archive.pipe(output);

    for (const filePath of filePaths) {
        const fileName = path.basename(filePath);
        archive.append(fs.createReadStream(filePath), { name: fileName });
    }

    await archive.finalize();
    return combinedZipFilePath;
}

app.get('/fetch-application-documents', (req, res) => {
    const combinedZipFilePath = path.join(__dirname, 'downloaded_documents', 'combined_documents.zip');
    res.download(combinedZipFilePath, 'combined_documents.zip', (err) => {
        if (err) {
            console.error('Error sending the combined ZIP file:', err.message);
            res.status(500).send('Failed to send the combined ZIP file.');
        } else {
            console.log('Combined ZIP file sent for download.');
        }
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
