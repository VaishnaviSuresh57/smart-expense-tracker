// receipts.js - Functionality for the receipts management page

// Function to show flash messages
function showFlashMessage(message, type = 'info') {
    // Create flash message container if it doesn't exist
    let flashContainer = document.querySelector('.flash-messages');
    if (!flashContainer) {
        flashContainer = document.createElement('div');
        flashContainer.className = 'flash-messages';
        document.body.insertBefore(flashContainer, document.body.firstChild);
    }
    
    // Create the message element
    const flashMessage = document.createElement('div');
    flashMessage.className = `flash-message ${type}`;
    flashMessage.innerHTML = `
        <span>${message}</span>
        <button class="close-flash">&times;</button>
    `;
    
    // Add to container
    flashContainer.appendChild(flashMessage);
    
    // Add close button functionality
    const closeButton = flashMessage.querySelector('.close-flash');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            flashMessage.remove();
        });
    }
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (flashMessage.parentNode) {
            flashMessage.remove();
        }
    }, 5000);
}

// Ajax request helper function
function ajaxRequest(url, method, data, successCallback, errorCallback) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            let response;
            try {
                response = JSON.parse(xhr.responseText);
            } catch (e) {
                response = xhr.responseText;
            }
            if (successCallback) successCallback(response);
        } else {
            if (errorCallback) errorCallback(xhr.statusText);
            else console.error('Request failed with status:', xhr.status);
        }
    };
    
    xhr.onerror = function() {
        if (errorCallback) errorCallback('Network error');
        else console.error('Network error occurred');
    };
    
    if (!(data instanceof FormData) && method.toUpperCase() !== 'GET') {
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    }
    
    xhr.send(data);
}

document.addEventListener('DOMContentLoaded', function() {
    // Handle receipt upload form
    const receiptForm = document.getElementById('receipt-upload-form');
    if (receiptForm) {
        receiptForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleReceiptUpload(receiptForm);
        });
    }

    // Handle receipt view buttons
    const viewButtons = document.querySelectorAll('.view-receipt-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const receiptId = this.getAttribute('data-receipt-id');
            showReceiptDetails(receiptId);
        });
    });
    
    // Handle receipt delete buttons
    const deleteButtons = document.querySelectorAll('.delete-receipt-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const receiptId = this.getAttribute('data-receipt-id');
            deleteReceiptConfirm(receiptId);
        });
    });

    // Handle modal close buttons
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });

    // Handle add item button
    const addItemButton = document.getElementById('add-receipt-item-btn');
    if (addItemButton) {
        addItemButton.addEventListener('click', addReceiptItem);
    }

    // Handle save changes button
    const saveChangesButton = document.getElementById('save-receipt-changes-btn');
    if (saveChangesButton) {
        saveChangesButton.addEventListener('click', saveReceiptChanges);
    }

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Handle file input change to display filename
    const fileInput = document.getElementById('receipt-file');
    const fileNameDisplay = document.getElementById('file-name-display');
    if (fileInput && fileNameDisplay) {
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                fileNameDisplay.textContent = this.files[0].name;
                fileNameDisplay.style.display = 'block';
            } else {
                fileNameDisplay.textContent = '';
                fileNameDisplay.style.display = 'none';
            }
        });
    }
});

// Handle receipt upload
function handleReceiptUpload(form) {
    const formData = new FormData(form);
    const uploadBtn = form.querySelector('button[type="submit"]');
    
    // Check if uploadBtn exists before using it
    if (!uploadBtn) {
        console.error('Upload button not found');
        ajaxRequest('/receipts/upload', 'POST', formData, 
            function(response) {
                if (response.success) {
                    showFlashMessage(response.message || 'Receipt uploaded successfully!', 'success');
                    window.location.reload();
                } else {
                    showFlashMessage('Error uploading receipt: ' + response.error, 'error');
                }
            },
            function(error) {
                showFlashMessage('Error uploading receipt', 'error');
            }
        );
        return;
    }
    
    const originalBtnText = uploadBtn.innerHTML;
    
    // Show loading state
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning...';
    uploadBtn.disabled = true;
    
    ajaxRequest('/receipts/upload', 'POST', formData, 
        function(response) {
            if (response.success) {
                // Reset button state
                uploadBtn.innerHTML = originalBtnText;
                uploadBtn.disabled = false;
                
                // Reset form
                form.reset();
                const fileDisplay = document.getElementById('file-name-display');
                if (fileDisplay) {
                    fileDisplay.textContent = '';
                    fileDisplay.style.display = 'none';
                }
                
                // Show success message with additional info
                showFlashMessage(response.message || 'Receipt uploaded successfully!', 'success');
                
                // If the receipt needs review, show it immediately
                if (response.receipt && response.receipt.processing_status === 'needs_review') {
                    showReceiptDetails(response.receipt.id);
                    showFlashMessage('Please review and edit the scanned items as needed.', 'info');
                } else {
                    // Otherwise reload the page after a delay
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                }
            } else {
                // Reset button state
                uploadBtn.innerHTML = originalBtnText;
                uploadBtn.disabled = false;
                
                showFlashMessage('Error uploading receipt: ' + response.error, 'error');
            }
        },
        function(error) {
            // Reset button state
            uploadBtn.innerHTML = originalBtnText;
            uploadBtn.disabled = false;
            
            showFlashMessage('Error uploading receipt', 'error');
        }
    );
}

// Show receipt details in modal
function showReceiptDetails(receiptId) {
    // Fetch receipt data from server
    ajaxRequest(`/receipts/${receiptId}`, 'GET', null, 
        function(response) {
            if (response.success) {
                const receipt = response.receipt;
                const modal = document.getElementById('receipt-details-modal');
                if (!modal) return;
                
                // Set receipt image
                const imageElement = document.getElementById('modal-receipt-image');
                if (imageElement) {
                    let imagePath = receipt.image_path;
                    if (imagePath.startsWith('static/')) {
                        imagePath = imagePath.replace('static/', '');
                    } else if (imagePath.startsWith('uploads/')) {
                        imagePath = imagePath;
                    }
                    imageElement.src = `/static/${imagePath}`;
                }
                
                // Populate items table
                const itemsList = document.getElementById('receipt-items-list');
                if (itemsList) {
                    itemsList.innerHTML = '';
                    
                    if (receipt.items && Array.isArray(receipt.items)) {
                        receipt.items.forEach((item, index) => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td><input type="text" class="item-name" value="${item.item}" data-index="${index}"></td>
                                <td><input type="number" class="item-quantity" value="${item.quantity}" min="1" data-index="${index}"></td>
                                <td><input type="number" class="item-price" value="${item.price}" step="0.01" min="0" data-index="${index}"></td>
                                <td>
                                    <button class="btn btn-danger btn-sm delete-item-btn" data-index="${index}">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </td>
                            `;
                            itemsList.appendChild(row);
                            
                            // Add event listeners for the delete button
                            const deleteBtn = row.querySelector('.delete-item-btn');
                            deleteBtn.addEventListener('click', function() {
                                row.remove();
                                updateReceiptTotal();
                            });
                            
                            // Add event listeners for input changes
                            const inputs = row.querySelectorAll('input');
                            inputs.forEach(input => {
                                input.addEventListener('change', updateReceiptTotal);
                            });
                        });
                    }
                    
                    updateReceiptTotal();
                }
                
                // Set receipt ID for save button
                const saveButton = document.getElementById('save-receipt-changes-btn');
                if (saveButton) {
                    saveButton.setAttribute('data-receipt-id', receipt.id);
                }
                
                // Show the modal
                modal.style.display = 'block';
            } else {
                showFlashMessage('Error loading receipt details', 'error');
            }
        },
        function(error) {
            showFlashMessage('Error loading receipt details', 'error');
        }
    );
}

// Handle view receipt
function handleViewReceipt(e) {
    const receiptId = this.getAttribute('data-id');
    const modal = document.getElementById('view-receipt-modal');
    
    // Populate modal with receipt data
    const receiptTitle = modal.querySelector('.modal-title');
    const receiptDate = modal.querySelector('.receipt-date');
    const receiptItems = modal.querySelector('.receipt-items');
    const receiptTotal = modal.querySelector('.receipt-total');
    
    // Get receipt data from the page or make an AJAX request
    const receiptData = JSON.parse(this.getAttribute('data-receipt'));
    
    receiptTitle.textContent = receiptData.store || 'Receipt Details';
    receiptDate.textContent = formatDate(receiptData.date);
    
    // Clear previous items
    receiptItems.innerHTML = '';
    
    // Add receipt items
    let total = 0;
    receiptData.items.forEach(item => {
        const itemRow = document.createElement('tr');
        itemRow.innerHTML = `
            <td>${item.item}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.price)}</td>
            <td>${formatCurrency(item.quantity * item.price)}</td>
        `;
        receiptItems.appendChild(itemRow);
        total += item.quantity * item.price;
    });
    
    receiptTotal.textContent = formatCurrency(total);
    
    // Show modal
    modal.style.display = 'block';
}

// Handle edit receipt
function handleEditReceipt(e) {
    const receiptId = this.getAttribute('data-id');
    const modal = document.getElementById('edit-receipt-modal');
    
    // Populate modal with receipt data
    const receiptForm = modal.querySelector('#edit-receipt-form');
    const storeInput = receiptForm.querySelector('[name="store"]');
    const dateInput = receiptForm.querySelector('[name="date"]');
    const itemsContainer = receiptForm.querySelector('.receipt-items-container');
    
    // Get receipt data from the page or make an AJAX request
    const receiptData = JSON.parse(this.getAttribute('data-receipt'));
    
    storeInput.value = receiptData.store || '';
    dateInput.value = receiptData.date ? receiptData.date.split('T')[0] : '';
    
    // Clear previous items
    itemsContainer.innerHTML = '';
    
    // Add receipt items
    receiptData.items.forEach((item, index) => {
        const itemRow = document.createElement('div');
        itemRow.className = 'receipt-item-row';
        itemRow.innerHTML = `
            <input type="text" name="items[${index}][item]" value="${item.item}" required>
            <input type="number" name="items[${index}][quantity]" value="${item.quantity}" min="1" required>
            <input type="number" name="items[${index}][price]" value="${item.price}" step="0.01" min="0" required>
            <button type="button" class="remove-item-btn">Remove</button>
        `;
        itemsContainer.appendChild(itemRow);
        
        // Add event listener to remove button
        const removeButton = itemRow.querySelector('.remove-item-btn');
        removeButton.addEventListener('click', function() {
            itemsContainer.removeChild(itemRow);
        });
    });
    
    // Set receipt ID in form
    const receiptIdInput = receiptForm.querySelector('[name="receipt_id"]');
    receiptIdInput.value = receiptId;
    
    // Show modal
    modal.style.display = 'block';
    
    // Handle form submission
    receiptForm.onsubmit = function(e) {
        e.preventDefault();
        
        const formData = new FormData(receiptForm);
        
        ajaxRequest('/receipts/update', 'POST', formData, 
            function(response) {
                if (response.success) {
                    showFlashMessage('Receipt updated successfully!', 'success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    showFlashMessage('Error updating receipt: ' + response.error, 'error');
                }
            },
            function(error) {
                showFlashMessage('Error updating receipt', 'error');
            }
        );
    };
}

// Delete receipt with confirmation
function deleteReceiptConfirm(receiptId) {
    if (confirm('Are you sure you want to delete this receipt? This action cannot be undone.')) {
        const formData = new FormData();
        formData.append('receipt_id', receiptId);
        
        ajaxRequest('/receipts/delete', 'POST', formData, 
            function(response) {
                if (response.success) {
                    showFlashMessage('Receipt deleted successfully!', 'success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    showFlashMessage('Error deleting receipt: ' + response.error, 'error');
                }
            },
            function(error) {
                showFlashMessage('Error deleting receipt', 'error');
            }
        );
    }
}

// Handle delete receipt (legacy function)
function handleDeleteReceipt(e) {
    const receiptId = this.getAttribute('data-id');
    deleteReceiptConfirm(receiptId);
}

// Close modal
function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// Add updateReceiptTotal function
function updateReceiptTotal() {
    const itemRows = document.querySelectorAll('#receipt-items-list tr');
    let total = 0;
    
    itemRows.forEach(row => {
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        total += quantity * price;
    });
    
    const totalElement = document.getElementById('receipt-total-amount');
    if (totalElement) {
        totalElement.textContent = total.toFixed(2);
    }
}

// Add receipt item
function addReceiptItem() {
    const itemsList = document.getElementById('receipt-items-list');
    if (!itemsList) return;
    
    const index = itemsList.children.length;
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" class="item-name" value="" placeholder="Item name" data-index="${index}"></td>
        <td><input type="number" class="item-quantity" value="1" min="1" data-index="${index}"></td>
        <td><input type="number" class="item-price" value="0.00" step="0.01" min="0" data-index="${index}"></td>
        <td>
            <button class="btn small danger delete-item-btn" data-index="${index}">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    itemsList.appendChild(row);
    
    // Add event listeners for the delete button
    const deleteBtn = row.querySelector('.delete-item-btn');
    deleteBtn.addEventListener('click', function() {
        row.remove();
        updateReceiptTotal();
    });
    
    // Add event listeners for input changes
    const inputs = row.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('change', updateReceiptTotal);
    });
    
    updateReceiptTotal();
}

// Save receipt changes
function saveReceiptChanges() {
    const receiptId = this.getAttribute('data-receipt-id');
    if (!receiptId) return;
    
    const itemRows = document.querySelectorAll('#receipt-items-list tr');
    const items = [];
    
    itemRows.forEach(row => {
        const item = {
            item: row.querySelector('.item-name').value,
            quantity: parseInt(row.querySelector('.item-quantity').value) || 1,
            price: parseFloat(row.querySelector('.item-price').value) || 0
        };
        items.push(item);
    });
    
    const formData = new FormData();
    formData.append('receipt_id', receiptId);
    formData.append('items', JSON.stringify(items));
    
    ajaxRequest('/receipts/update', 'POST', formData, 
        function(response) {
            if (response.success) {
                showFlashMessage('Receipt updated successfully!', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showFlashMessage('Error updating receipt: ' + response.error, 'error');
            }
        },
        function(error) {
            showFlashMessage('Error updating receipt', 'error');
        }
    );
}