// Clear cache function
function clearCache() {
    // Clear the input field
    document.getElementById('patentNumber').value = '';

    // Clear any checked checkboxes
    document.getElementById('grantedCheckbox').checked = false;
    document.getElementById('patentAsFiledCheckbox').checked = false;
    document.getElementById('abstractCheckbox').checked = false;
    document.getElementById('claimsCheckbox').checked = false;
    document.getElementById('specificationCheckbox').checked = false;

    // Hide buttons and messages
    const downloadButtonContainer = document.getElementById('download-button-container');
    const message = document.getElementById('message');
    const preloader = document.getElementById('preloader');

    downloadButtonContainer.style.display = 'block';
    message.innerText = '';
    preloader.style.display = 'none';
}

// Add click event listener to reset button
document.getElementById('resetButton').addEventListener('click', function () {
    clearCache();
});


document.getElementById('getGrantedButton').addEventListener('click', async function () {
    const documentType = document.getElementById('documentType').value;
    const applicationNumber = document.getElementById('patentNumber').value;
    const loadingMessage = document.getElementById('loadingMessage');

    if (documentType === 'application' && grantedCheckbox) {
        try {
            const response = await fetch('/fetch-granted-patent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    applicationNumber,
                }),
            });

            if (response.status === 200) {
                const data = await response.json();
                if (data.pdfDownloadURL) {
                    // Open the granted document in a new tab
                    window.open(data.pdfDownloadURL, '_blank');
                } else {
                    alert("Failed to retrieve the PDF download URL.");
                }
            } else {
                alert("No Granted Patent available.");
            }
        } catch (error) {
            console.error('Error:', error);
            alert("Failed to fetch the application data.");
        } finally {
            // Hide the loading message
            loadingMessage.style.display = 'none';
        }
    }
});



// -------------------------------------------------------------------------------------------
// document.getElementById('getGrantedButton').addEventListener('click', async function () {
//     const documentType = document.getElementById('documentType').value; 
//     const applicationNumber = document.getElementById('patentNumber').value;

//     if (documentType === 'application' && grantedCheckbox) {
//         try {
//             const response = await fetch('/fetch-granted-patent', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     applicationNumber,
//                 }),
//             });

//             if (response.status === 200) {
//                 const data = await response.json();
//                 if (data.pdfDownloadURL) {
//                     // Open the granted document in a new tab
//                     window.open(data.pdfDownloadURL, '_blank');
//                 } else {
//                     alert("Failed to retrieve the PDF download URL.");
//                 }
//             } else {
//                 alert("No Granted Patent available.");
//             }
//         } catch (error) {
//             console.error('Error:', error);
//             alert("Failed to fetch the application data.");
//         } finally {
//             const loadingMessage = document.getElementById('loadingMessage');
//             loadingMessage.style.display = 'none';
//         }
//     }
// });

// -------------------------------------------------------------------------------------------

// document.getElementById('getGrantedButton').addEventListener('click', async function () {
//     const documentType = document.getElementById('documentType').value;
//     const applicationNumber = document.getElementById('patentNumber').value;

//     if (documentType === 'application' && grantedCheckbox) {
//         try {
//             const response = await fetch('/fetch-granted-patent', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     applicationNumber,
//                 }),
//             });

//             if (response.status === 200) {
//                 const data = await response.json();
//                 const applicationMetaData = data.applicationMetaData || {};
//                 const patentNumber = applicationMetaData.patentNumber || '';

//                 if (patentNumber) {
//                     // Construct the PDF file URL using the patent number
//                     const pdfDownloadURL = `https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/${patentNumber}`;

//                     // Create an invisible anchor element to trigger the download
//                     const anchor = document.createElement('a');
//                     anchor.href = pdfDownloadURL;
//                     anchor.target = '_blank';
//                     anchor.download = `granted_patent.pdf`;
//                     anchor.style.display = 'none';
//                     document.body.appendChild(anchor);

//                     // Trigger a click event on the anchor element
//                     anchor.click();
//                 } else {
//                     alert("Patent number not found in the response.");
//                 }
//             } else {
//                 alert("No Granted Patent available.");
//             }
//         } catch (error) {
//             console.error('Error:', error);
//             alert("Failed to fetch the application data.");
//         } finally {
//             const loadingMessage = document.getElementById('loadingMessage');
//             loadingMessage.style.display = 'none';
//         }
//     }
// });




document.getElementById('documentForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    const grantedCheckbox = document.getElementById('grantedCheckbox');
    const patentNumberInput = document.getElementById('patentNumber');
    const patentNumber = patentNumberInput.value;
    const preloader = document.getElementById('preloader');
    const downloadButtonContainer = document.getElementById('download-button-container');
    const patentAsFiledCheckbox = document.getElementById('patentAsFiledCheckbox');
    const abstractCheckbox = document.getElementById('abstractCheckbox');
    const claimsCheckbox = document.getElementById('claimsCheckbox');
    const specificationCheckbox = document.getElementById('specificationCheckbox');

    preloader.style.display = 'block';
    downloadButtonContainer.style.display = 'none';

    // Validate patent number
    if (!/^\d{8}$/.test(patentNumber)) {
        alert("Please enter a valid number.");
        preloader.style.display = 'none';
        downloadButtonContainer.style.display = 'block';
        return;
    }

    if (patentAsFiledCheckbox.checked) {
        const selectedDocumentCodes = [];

        if (abstractCheckbox.checked) selectedDocumentCodes.push('ABST');
        if (claimsCheckbox.checked) selectedDocumentCodes.push('CLM');
        if (specificationCheckbox.checked) selectedDocumentCodes.push('SPEC');

        if (selectedDocumentCodes.length > 0) {
            try {
                const documentCodesString = selectedDocumentCodes.join(',');
                const response = await fetch('/trigger-app-js', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        patentNumber,
                        documentCodes: documentCodesString,
                    }),
                });

                if (response.status === 200) {
                    // Directly trigger download after processing
                    window.location.href = '/fetch-application-documents';
                } else {
                    alert("Failed to trigger app.js.");
                }
            } catch (error) {
                console.error('Error:', error);
                alert("Failed to trigger app.js.");
            } finally {
                preloader.style.display = 'none';
                downloadButtonContainer.style.display = 'block';
            }
        } else {
            alert("Please select a document to download.");
            preloader.style.display = 'none';
            downloadButtonContainer.style.display = 'block';
        }
    }
});


document.getElementById('patentAsFiledCheckbox').addEventListener('change', function () {
    const subCheckboxes = document.getElementById('subCheckboxes');
    const getPatentAsFiledButton = document.getElementById('getPatentAsFiledButton');

    if (this.checked) {
        subCheckboxes.style.display = 'block';
        getPatentAsFiledButton.style.display = 'block';
    } else {
        subCheckboxes.style.display = 'none';
        getPatentAsFiledButton.style.display = 'none';
    }
});

document.getElementById('grantedCheckbox').addEventListener('change', function () {
    const getGrantedButton = document.getElementById('getGrantedButton');

    if (this.checked) {
        getGrantedButton.style.display = 'block';
    } else {
        getGrantedButton.style.display = 'none';
    }
});
window.addEventListener('load', function () {
    clearCache();
});
