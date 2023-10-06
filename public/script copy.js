document.getElementById('documentForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    const documentType = document.getElementById('documentType').value;
    const filedCheckbox = document.getElementById('filedCheckbox');
    const grantedCheckbox = document.getElementById('grantedCheckbox');
    const patentNumber = document.getElementById('patentNumber').value;

    // Show the loading message
    const message = document.getElementById('message');
    message.innerText = 'Fetching the document. Please wait...';

    if (grantedCheckbox.checked) {
        // Redirect the user to the granted documents URL with the updated patent number
        const grantedURL = `https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/${patentNumber}`;
        window.open(grantedURL, '_blank');

        // Clear the loading message and show the download button
        message.innerText = ''; // Clear the loading message
        const downloadButtonContainer = document.getElementById('download-button-container');
        downloadButtonContainer.innerHTML = ''; // Clear any previous buttons
        const downloadButton = document.createElement('button');
        downloadButton.innerText = 'Download Document';
        downloadButton.addEventListener('click', async () => {
            // Redirect to the download URL
            window.location.href = `/downloaded-documents/${data.filePath}`;
        });
        downloadButtonContainer.appendChild(downloadButton);
    } else if (filedCheckbox.checked) {
        const abstractCheckbox = document.getElementById('abstractCheckbox');
        const claimsCheckbox = document.getElementById('claimsCheckbox');
        const specificationCheckbox = document.getElementById('specificationCheckbox');
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
                    // Clear the loading message and show the download button
                    message.innerText = ''; // Clear the loading message
                    const downloadButtonContainer = document.getElementById('download-button-container');
                    downloadButtonContainer.innerHTML = ''; // Clear any previous buttons
                    const downloadButton = document.createElement('button');
                    downloadButton.innerText = 'Download Document';
                    downloadButton.addEventListener('click', async () => {
                        // Fetch and download the document
                        try {
                            const downloadResponse = await fetch('/fetch-application-documents', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    patentNumber,
                                }),
                            });

                            if (downloadResponse.status === 200) {
                                const data = await downloadResponse.json();
                                if (data.filePath) {
                                    // Redirect to the download URL
                                    window.location.href = `${data.filePath}`;
                                } else {
                                    alert("Failed to fetch the download URL.");
                                }
                            } else {
                                alert("Failed to fetch the download URL.");
                            }
                        } catch (error) {
                            console.error('Error:', error);
                            alert("Failed to fetch the download URL.");
                        }
                    });
                    downloadButtonContainer.appendChild(downloadButton);
                } else {
                    alert("Failed to trigger app.js.");
                }
            } catch (error) {
                console.error('Error:', error);
                alert("Failed to trigger app.js.");
            }
        } else {
            alert("Please select a document to download.");
            message.innerText = ''; // Clear the loading message
        }
    }
});

document.getElementById('filedCheckbox').addEventListener('change', function () {
    const subCheckboxes = document.getElementById('subCheckboxes');

    if (this.checked) {
        subCheckboxes.style.display = 'block';
    } else {
        subCheckboxes.style.display = 'none';
    }
});

function resetForm() {
    // Reset the form
    document.getElementById('documentForm').reset();

    // Hide the download button
    const downloadButtonContainer = document.getElementById('download-button-container');
    downloadButtonContainer.innerHTML = '';

    // Clear the loading message
    const message = document.getElementById('message');
    message.innerText = '';
}

document.getElementById('resetButton').addEventListener('click', resetForm);
