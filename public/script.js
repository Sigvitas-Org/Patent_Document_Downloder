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

    downloadButtonContainer.style.display = 'none';
    message.innerText = '';
    preloader.style.display = 'none';
}

// Add click event listener to reset button
document.getElementById('resetButton').addEventListener('click', function () {
    clearCache();
});

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
        alert("Please enter an Vaild number.");
        preloader.style.display = 'none';
        downloadButtonContainer.style.display = 'block';
        return;
    }

    if (grantedCheckbox.checked) {
        try {
            const grantedURL = `https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/${patentNumber}`;
            window.open(grantedURL, '_blank');
        } catch (error) {
            console.error('Error:', error);
            alert("Failed to fetch the download URL.");
        } finally {
            preloader.style.display = 'none';
            downloadButtonContainer.style.display = 'block';
        }
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
