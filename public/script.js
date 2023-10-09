document.getElementById('documentForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    const documentType = document.getElementById('documentType').value;
    const filedCheckbox = document.getElementById('filedCheckbox');
    const grantedCheckbox = document.getElementById('grantedCheckbox');
    const patentNumber = document.getElementById('patentNumber').value;


    const message = document.getElementById('message');
    message.innerText = 'Fetching the document. Please wait...';

    if (grantedCheckbox.checked) {

        const downloadButtonContainer = document.getElementById('download-button-container');
        downloadButtonContainer.innerHTML = ''; 
        const downloadButton = document.createElement('button');
        downloadButton.innerText = 'Download Granted Patent';
        downloadButton.addEventListener('click', async () => {
           
            const grantedURL = `https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/${patentNumber}`;
            window.open(grantedURL, '_blank');
        });
        downloadButtonContainer.appendChild(downloadButton);

       
        message.innerText = '';
    }

    if (filedCheckbox.checked) {
        const abstractCheckbox = document.getElementById('abstractCheckbox');
        const claimsCheckbox = document.getElementById('claimsCheckbox');
        const specificationCheckbox = document.getElementById('specificationCheckbox');
        const selectedDocumentCodes = [];

        if (abstractCheckbox.checked) selectedDocumentCodes.push('ABST');
        if (claimsCheckbox.checked) selectedDocumentCodes.push('CLM');
        if (specificationCheckbox.checked) selectedDocumentCodes.push('SPEC');



        // const downloadButtonContainer = document.getElementById('download-button-container');
        // downloadButtonContainer.innerHTML = '';
        // const downloadButton = document.createElement('button');
        // downloadButton.innerText = 'Download Filed Patent';
        // downloadButton.addEventListener('click', async () => {
        //     try {
        //         // Fetch and download the combined ZIP file
        //         const downloadResponse = await fetch('/downloaded-documents/combined_documents.zip');
        //         if (downloadResponse.status === 200) {
        //             const blob = await downloadResponse.blob();
        //             const url = window.URL.createObjectURL(blob);
        //             const a = document.createElement('a');
        //             a.style.display = 'none';
        //             a.href = url;
        //             a.download = 'combined_documents.zip';
        //             document.body.appendChild(a);
        //             a.click();
        //             window.URL.revokeObjectURL(url);
        //         } else {
        //             alert("Failed to fetch the download URL.");
        //         }
        //     } catch (error) {
        //         console.error('Error:', error);
        //         alert("Failed to fetch the download URL.");
        //     }
        // });

        // downloadButtonContainer.appendChild(downloadButton);

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
                  
                    message.innerText = '';

                  
                    const downloadButtonContainer = document.getElementById('download-button-container');
                    downloadButtonContainer.innerHTML = '';
                    const downloadButton = document.createElement('button');
                    downloadButton.innerText = 'Download Combined Documents';
                    downloadButton.addEventListener('click', async () => {
                        try {
                            const downloadResponse = await fetch('/fetch-application-documents', {
                                method: 'GET', 
                            });

                            if (downloadResponse.status === 200) {
                               
                                window.location.href = '/fetch-application-documents';
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
        }
        else {
            alert("Please select a document to download.");
            message.innerText = '';
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
