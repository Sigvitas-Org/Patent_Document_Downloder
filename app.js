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
app.use(express.static('downloads'));

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

app.post('/process-application-number', (req, res) => {
    const { applicationNumber } = req.body; // Extract the application number from the request body

    // Handle the application number as needed (e.g., process it, store it, etc.)
    console.log('Received Application Number:', applicationNumber);

    // Send a response (you can modify this part as needed)
    res.json({ message: 'Application number received successfully' });
});

app.post('/store-granted-response', (req, res) => {
    const { response } = req.body;

    if (!response) {
        res.status(400).send('Invalid response data');
        return;
    }

    // Store the response data on the server
    const responseJSON = JSON.stringify(response, null, 2);

    // Define the path and filename where you want to save the response
    const filePath = path.join(__dirname, 'responses', 'granted-response.json');

    // Write the response to a file
    fs.writeFile(filePath, responseJSON, (err) => {
        if (err) {
            console.error('Error writing response to file:', err);
            res.status(500).send('Error storing the response');
        } else {
            console.log('Response stored successfully');
            res.status(200).send('Response stored successfully');
        }
    });
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
                console.log('Request Body:', req.body);
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


app.post('/fetch-granted-patent', async (req, res) => {
    const { applicationNumber } = req.body;

    if (!applicationNumber) {
        return res.status(400).send('Application number is required.');
    }

    try {
        // Send a request to an external API
        const response = await axios.get(`https://patentcenter.uspto.gov/retrieval/public/v2/application/data?applicationNumberText=${applicationNumber}`);

        const data = response.data;
        const applicationMetaData = data.applicationMetaData || {};
        const patentNumber = applicationMetaData.patentNumber || '';

        if (patentNumber) {
            // Construct the download URL using the patentNumber
            const pdfDownloadURL = `https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/${patentNumber}`;

            // Define the path where you want to save the JSON file
            const filePath = path.join(__dirname, 'downloads', `${patentNumber}.json`);

            // Save the response data as a JSON file
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

            // Respond with the download URL
            res.json({ pdfDownloadURL });
        } else {
            res.status(500).json({ message: 'Patent number not found in response.' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error fetching data from USPTO.' });
    }
});
// app.post('/fetch-granted-patent', async (req, res) => {
//     const { applicationNumber } = req.body;

//     if (!applicationNumber) {
//         return res.status(400).send('Application number is required.');
//     }

//     try {
//         const response = await axios.get(
//             `https://patentcenter.uspto.gov/retrieval/public/v2/application/data?applicationNumberText=${applicationNumber}`
//         );

//         const data = response.data;

//         // Define the path where you want to save the JSON file
//         const filePath = path.join(__dirname, 'application_data.json');

//         fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
//             if (err) {
//                 console.error('Error writing application data to file:', err);
//                 res.status(500).json({ message: 'Error saving application data.' });
//             } else {
//                 res.json({ message: 'Data saved successfully.' });
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching data from USPTO.' });
//     }
// });

// Server-side route to handle download request
app.post('/fetch-patent-data', async (req, res) => {
    const { patentNumber } = req.body;

    try {
        // Construct the URL for the API request
        const apiUrl = `https://patentcenter.uspto.gov/retrieval/public/v2/application/data?patentNumber=${patentNumber}`;

        const response = await axios.get(apiUrl);
        const responseData = response.data;

        // Extract the "applicationNumberText" from the response
        const applicationNumberText = responseData.applicationMetaData.applicationIdentification.applicationNumberText.trim();

        // Store the response data in a local file
        // You may modify this part to store the response in a directory
        fs.writeFileSync(`responses/${patentNumber}.json`, JSON.stringify(responseData, null, 2));

        // Pass the application number to the client-side
        res.json({ applicationNumberText });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});





const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
