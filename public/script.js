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




// Get Granted if application & Granted is checked
document.getElementById('getGrantedButton').addEventListener('click', async function () {
    const documentType = document.getElementById('documentType').value;
    const applicationNumber = document.getElementById('patentNumber').value;
    const grantedCheckbox = document.getElementById('grantedCheckbox');

    if (documentType === 'granted' && grantedCheckbox.checked) {
        try {
            // Check if the user entered a valid patent number
            if (!/^\d{7,8}$/.test(applicationNumber)) {
                alert("Please enter a valid patent number.");
                return;
            }

            const pdfDownloadURL = `https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/${applicationNumber}`;
            window.open(pdfDownloadURL, '_blank', 'only-granted');
        } catch (error) {
            console.error('Error:', error);
            alert("Failed to fetch the application data.");
        }
    }
});

// Get Patent as Filed is Checked
document.getElementById('getPatentAsFiledButton').addEventListener('click', async function () {
    const documentType = document.getElementById('documentType').value;
    const patentNumberInput = document.getElementById('patentNumber');
    const patentNumber = patentNumberInput.value;
    const preloader = document.getElementById('preloader');
    const downloadButtonContainer = document.getElementById('download-button-container');
    const patentAsFiledCheckbox = document.getElementById('patentAsFiledCheckbox');
    const abstractCheckbox = document.getElementById('abstractCheckbox');
    const claimsCheckbox = document.getElementById('claimsCheckbox');
    const specificationCheckbox = document.getElementById('specificationCheckbox');
    const loadingMessage = document.getElementById('loadingMessage');

    preloader.style.display = 'block';
    downloadButtonContainer.style.display = 'none';

    // Validate patent number
    // if (!/^\d{8}$/.test(patentNumber)) {
    //     alert('Please enter a valid number.');
    //     preloader.style.display = 'none';
    //     downloadButtonContainer.style.display = 'block';
    //     return;
    // }

    // ...
    // ...
    
    if (documentType === 'granted' && patentAsFiledCheckbox.checked) {
        const selectedDocumentCodes = [];

        if (abstractCheckbox.checked) selectedDocumentCodes.push('ABST');
        if (claimsCheckbox.checked) selectedDocumentCodes.push('CLM');
        if (specificationCheckbox.checked) selectedDocumentCodes.push('SPEC');

        if (selectedDocumentCodes.length > 0) {
            try {
                // Send a request to fetch data from USPTO
                const apiUrl = `https://patentcenter.uspto.gov/retrieval/public/v2/application/data?patentNumber=${patentNumber}`;
                const response = await fetch(apiUrl);

                if (response.status === 200) {
                    const data = await response.json();
                    const applicationNumberText = data.applicationMetaData.applicationIdentification.applicationNumberText.trim();

                    // Log the Application Number for confirmation
                    console.log('Application Number:', applicationNumberText);

                    // Send the "applicationNumberText" to the server
                    const serverResponse = await fetch('/process-application-number', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            applicationNumberText,
                        }),
                    });

                    if (serverResponse.status === 200) {
                        alert('Application number sent successfully.');
                    } else {
                        alert('Failed to send application number to the server.');
                    }
                } else {
                    // alert('Failed to fetch application data.');
                }
            } catch (error) {
                console.error('Error:', error);
                // alert('Failed to fetch application data.');
            } finally {
                preloader.style.display = 'none';
                downloadButtonContainer.style.display = 'block';
            }
        } else {
            alert('Please select at least one sub-document to download.');
            preloader.style.display = 'none';
            downloadButtonContainer.style.display = 'block';
        }
    }
    // ...


});

// ####

document.getElementById('getPatentAsFiledButton').addEventListener('click', async function () {
    const documentType = document.getElementById('documentType').value;
    const patentNumberInput = document.getElementById('patentNumber');
    const patentNumber = patentNumberInput.value;
    const preloader = document.getElementById('preloader');
    const downloadButtonContainer = document.getElementById('download-button-container');
    const patentAsFiledCheckbox = document.getElementById('patentAsFiledCheckbox');
    const abstractCheckbox = document.getElementById('abstractCheckbox');
    const claimsCheckbox = document.getElementById('claimsCheckbox');
    const specificationCheckbox = document.getElementById('specificationCheckbox');
    const loadingMessage = document.getElementById('loadingMessage');

    preloader.style.display = 'block';
    downloadButtonContainer.style.display = 'none';

    // Validate patent number
    // if (!/^\d{8}$/.test(patentNumber)) {
    //     alert('Please enter a valid number.');
    //     preloader.style.display = 'none';
    //     downloadButtonContainer.style.display = 'block';
    //     return;
    // }

    if (documentType === 'granted' && patentAsFiledCheckbox.checked) {
        const selectedDocumentCodes = [];

        if (abstractCheckbox.checked || claimsCheckbox.checked || specificationCheckbox.checked) {
            if (abstractCheckbox.checked) selectedDocumentCodes.push('ABST');
            if (claimsCheckbox.checked) selectedDocumentCodes.push('CLM');
            if (specificationCheckbox.checked) selectedDocumentCodes.push('SPEC');

            try {
                // Send a request to the server-side route
                const response = await fetch('/fetch-patent-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        patentNumber,
                    }),
                });

                if (response.status === 200) {
                    const data = await response.json();
                    const applicationNumberText = data.applicationNumberText;

                    // Check if the user has selected at least one sub-document
                    if (selectedDocumentCodes.length > 0) {
                        // Prepare the request body for trigger-app.js
                        const documentCodesString = selectedDocumentCodes.join(',');
                        const triggerAppData = {
                            patentNumber: applicationNumberText, // Use the received application number
                            documentCodes: documentCodesString,
                        };

                        // Send the request to trigger-app.js
                        const triggerAppResponse = await fetch('/trigger-app-js', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(triggerAppData),
                        });

                        if (triggerAppResponse.status === 200) {
                            // Redirect to the page to download documents
                            window.location.href = '/fetch-application-documents';
                        } else {
                            alert("Failed to trigger app.js.");
                        }
                    } else {
                        alert('Please select at least one sub-document to download.');
                    }
                } else {
                    // alert('Failed to fetch application data.');
                }
            } catch (error) {
                console.error('Error:', error);
                // alert('Failed to fetch application data.');
            } finally {
                preloader.style.display = 'none';
                downloadButtonContainer.style.display = 'block';
            }
        } else {
            alert('Please select at least one sub-document to download.');
            preloader.style.display = 'none';
            downloadButtonContainer.style.display = 'block';
        }
    }
});


// Get Granted if application & Granted is checked 
// Start//
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
// END //



//  Patent as Filed is Checked 
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
    // if (!/^\d{5}$/.test(patentNumber)) {
    //     alert("Please enter a valid number.");
    //     preloader.style.display = 'none';
    //     downloadButtonContainer.style.display = 'block';
    //     return;
    // }

    if (selectedDocumentCodes.length > 0) {
        try {
            let postBody = {
                documentCodes: documentCodesString,
            };

            // Check your condition here
            if (documentType === 'granted' && patentAsFiledCheckbox.checked) {
                const selectedDocumentCodes = [];
                // Fetch and add the application number to the request body
                const response = await fetch(`/fetch-patent-data?patentNumber=${patentNumber}`, {
                    method: 'GET',
                });

                if (response.status === 200) {
                    const data = await response.json();
                    postBody.applicationNumberText = data.applicationNumberText;
                } else {
                    alert("Failed to fetch application data.");
                    return;
                }
            } else {
                postBody.patentNumber = patentNumber;
            }

            const response = await fetch('/trigger-app-js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postBody),
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

});
// ####################################

document.getElementById('getPatentAsFiledButton').addEventListener('click', async function () {
    const documentType = document.getElementById('documentType').value;
    const patentNumberInput = document.getElementById('patentNumber');
    const patentNumber = patentNumberInput.value;
    const preloader = document.getElementById('preloader');
    const downloadButtonContainer = document.getElementById('download-button-container');
    const patentAsFiledCheckbox = document.getElementById('patentAsFiledCheckbox');
    const abstractCheckbox = document.getElementById('abstractCheckbox');
    const claimsCheckbox = document.getElementById('claimsCheckbox');
    const specificationCheckbox = document.getElementById('specificationCheckbox');
    const loadingMessage = document.getElementById('loadingMessage');

    preloader.style.display = 'block';
    downloadButtonContainer.style.display = 'none';

    // Validate patent number
    if (!/^\d{8}$/.test(patentNumber)) {
        alert('Please enter a valid number.');
        preloader.style.display = 'none';
        downloadButtonContainer.style.display = 'block';
        return;
    }

    if (documentType === 'application' && patentAsFiledCheckbox.checked) {
        const selectedDocumentCodes = [];

        if (abstractCheckbox.checked || claimsCheckbox.checked || specificationCheckbox.checked) {
            if (abstractCheckbox.checked) selectedDocumentCodes.push('ABST');
            if (claimsCheckbox.checked) selectedDocumentCodes.push('CLM');
            if (specificationCheckbox.checked) selectedDocumentCodes.push('SPEC');

            try {
                // Send a request to the server-side route
                const response = await fetch('/fetch-patent-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        patentNumber,
                    }),
                });

                if (response.status === 200) {
                    const data = await response.json();
                    const applicationNumberText = data.applicationNumberText;

                    // Check if the user has selected at least one sub-document
                    if (selectedDocumentCodes.length > 0) {
                        // Prepare the request body for trigger-app.js
                        const documentCodesString = selectedDocumentCodes.join(',');
                        const triggerAppData = {
                            patentNumber,
                            documentCodes: documentCodesString,
                        };

                        // Send the request to trigger-app.js
                        const triggerAppResponse = await fetch('/trigger-app-js', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(triggerAppData),
                        });

                        if (triggerAppResponse.status === 200) {
                            // Redirect to the page to download documents
                            window.location.href = '/fetch-application-documents';
                        } else {
                            alert("Failed to trigger app.js.");
                        }
                    } else {
                        alert('Please select at least one sub-document to download.');
                    }
                } else {
                    // alert('Failed to fetch application data.');
                }
            } catch (error) {
                console.error('Error:', error);
                // alert('Failed to fetch application data.');
            } finally {
                preloader.style.display = 'none';
                downloadButtonContainer.style.display = 'block';
            }
        } else {
            alert('Please select at least one sub-document to download.');
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
