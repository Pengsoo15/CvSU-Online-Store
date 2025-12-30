// CvSU Online School Store JavaScript Functions

// Initialize cart in parent window to persist across frames
if (window.top && !window.top.shoppingCart) {
    window.top.shoppingCart = [];
}

// Toast Notification System
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// Add items to cart
function addToCart(productName, price) {
    var cart = getCart();
    var item = { name: productName, price: price, quantity: 1 };
    
    var found = false;
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].name === productName) {
            cart[i].quantity++;
            found = true;
            break;
        }
    }
    
    if (!found) { cart.push(item); }
    saveCart(cart);
    updateCartCount();
    showToast(`${productName} added to cart!`);
}

// Display cart items
function displayCart() {
    var cart = getCart();
    var cartItemsDiv = document.getElementById('cartItems');
    var cartSummary = document.getElementById('cartSummary');
    var emptyCart = document.getElementById('emptyCart');

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '';
        emptyCart.style.display = 'block';
        cartSummary.style.display = 'none';
        return;
    }

    emptyCart.style.display = 'none';
    cartSummary.style.display = 'block';
    
    var html = '';
    var subtotal = 0;
    
    for (var i = 0; i < cart.length; i++) {
        var item = cart[i];
        var itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        html += `
        <div class="cart-item-card">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">₱${item.price.toFixed(2)} x ${item.quantity} = ₱${itemTotal.toFixed(2)}</div>
            </div>
            <div class="cart-item-controls">
                <button onclick="updateQuantity('${item.name}', -1)" class="btn-qty">-</button>
                <span class="qty-display">${item.quantity}</span>
                <button onclick="updateQuantity('${item.name}', 1)" class="btn-qty">+</button>
                <button onclick="removeFromCart('${item.name}')" class="btn-remove">Remove</button>
            </div>
        </div>`;
    }
    
    cartItemsDiv.innerHTML = html;
    document.getElementById('subtotal').innerHTML = '₱' + subtotal.toFixed(2);
    document.getElementById('total').innerHTML = '₱' + (subtotal + 50).toFixed(2);
}

// Update item quantity
function updateQuantity(productName, change) {
    var cart = getCart();
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].name === productName) {
            cart[i].quantity += change;
            if (cart[i].quantity <= 0) {
                cart.splice(i, 1);
            }
            break;
        }
    }
    saveCart(cart);
    updateCartCount();
    displayCart();
}

// Remove item from cart
function removeFromCart(productName) {
    var cart = getCart();
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].name === productName) {
            cart.splice(i, 1);
            break;
        }
    }
    saveCart(cart);
    updateCartCount();
    displayCart();
    showToast(`${productName} removed from cart`);
}

// Clear entire cart
function clearCart() {
    saveCart([]);
    updateCartCount();
    displayCart();
    showToast('Cart cleared');
}

// Checkout process
function processCheckout(event) {
    event.preventDefault();
    console.log('Checkout started');
    
    const cart = getCart();
    if (cart.length === 0) {
        showToast('Your cart is empty!', 'error');
        return false;
    }
    
    const paymentMethod = document.getElementById('paymentMethod').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    if (!paymentMethod) {
        showToast('Please select a payment method', 'error');
        return false;
    }
    
    if (!agreeTerms) {
        showToast('Please agree to the terms and conditions', 'error');
        return false;
    }
    
    // Validate online payment fields if selected
    if (paymentMethod === 'online') {
        const cardNumber = document.getElementById('cardNumber').value;
        const expiryDate = document.getElementById('expiryDate').value;
        const cvv = document.getElementById('cvv').value;
        
        if (!cardNumber || !expiryDate || !cvv) {
            showToast('Please fill in all payment details', 'error');
            return false;
        }
        
        if (cardNumber.replace(/\s/g, '').length < 16) {
            showToast('Please enter a valid card number', 'error');
            return false;
        }
    }
    
    // Get authenticated user info
    const currentStudent = JSON.parse(sessionStorage.getItem('currentStudent') || 'null');
    console.log('Current student:', currentStudent);
    
    // Calculate total
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + 50;
    
    // Generate order ID
    const orderId = 'ORD-' + Date.now();
    
    // Create order data for QR code
    const orderData = {
        orderId: orderId,
        studentName: currentStudent.name,
        studentEmail: currentStudent.email,
        items: cart,
        subtotal: subtotal.toFixed(2),
        shipping: '50.00',
        total: total.toFixed(2),
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'online' ? 'Paid' : 'Pending (Cash on Pickup)',
        orderDate: new Date().toLocaleString(),
        pickupLocation: 'CvSU Main Campus - Student Center Building'
    };
    
    console.log('Order data:', orderData);
    
    // Process payment
    if (paymentMethod === 'online') {
        showToast('Processing online payment...', 'success');
        setTimeout(() => {
            showToast('Payment successful! Order confirmed.', 'success');
            console.log('About to show order confirmation');
            generateOrderConfirmation(orderData);
            showOrderModal();
            setTimeout(() => clearCart(), 1000);
        }, 2000);
    } else {
        showToast('Order placed! Pay cash on pickup.', 'success');
        console.log('About to show order confirmation');
        generateOrderConfirmation(orderData);
        showOrderModal();
        setTimeout(() => clearCart(), 1000);
    }
    
    return false;
}

// Order confirmation function
function generateOrderConfirmation(orderData) {
    console.log('generateOrderConfirmation called with:', orderData);
    
    // Display order details
    const orderDetails = document.getElementById('orderDetails');
    if (orderDetails) {
        orderDetails.innerHTML = `
            <div class="qr-order-info">
                <h4>Order Confirmation</h4>
                <p><strong>Student:</strong> ${orderData.studentName}</p>
                <p><strong>Email:</strong> ${orderData.studentEmail}</p>
                <p><strong>Order ID:</strong> ${orderData.orderId}</p>
                <p><strong>Payment Status:</strong> <span class="${orderData.paymentStatus === 'Paid' ? 'paid' : 'unpaid'}">${orderData.paymentStatus}</span></p>
                <p><strong>Total:</strong> ₱${orderData.total}</p>
                <div class="order-items">
                    <strong>Items:</strong>
                    <ul>
                        ${orderData.items.map(item => `<li>${item.name} x${item.quantity} - ₱${(item.price * item.quantity).toFixed(2)}</li>`).join('')}
                    </ul>
                </div>
                <p style="margin-top: 15px; color: #666;">📍 Pickup Location: ${orderData.pickupLocation}</p>
            </div>
        `;
    }
}

// Show order modal
function showOrderModal() {
    console.log('showOrderModal called');
    const orderModal = document.getElementById('orderModal');
    console.log('Order modal found:', orderModal);
    
    if (orderModal) {
        orderModal.style.display = 'block';
        console.log('Order modal displayed');
    } else {
        console.error('Order modal not found!');
        alert('Order placed successfully!');
    }
}

// Cart utility functions
function getCart() { return (window.top && window.top.shoppingCart) ? window.top.shoppingCart : []; }
function saveCart(cart) { if (window.top) { window.top.shoppingCart = cart; } }

function updateCartCount() {
    var cart = getCart();
    var totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    try {
        if (window.top.frames.navFrame) {
            var el = window.top.frames.navFrame.document.getElementById('cartCount');
            if (el) el.innerHTML = totalItems;
        }
    } catch (e) { console.log("Nav frame update delayed"); }
}

// Product filtering function
function filterProducts() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const priceFilter = document.getElementById('priceFilter').value;
    const sortFilter = document.getElementById('sortFilter').value;
    const products = document.querySelectorAll('.product-card');
    const noResults = document.getElementById('noResults');
    
    let visibleProducts = [];
    
    products.forEach(product => {
        const category = product.getAttribute('data-category');
        const price = parseInt(product.getAttribute('data-price'));
        let showProduct = true;
        
        // Category filter
        if (categoryFilter !== 'all' && category !== categoryFilter) {
            showProduct = false;
        }
        
        // Price filter
        if (priceFilter !== 'all') {
            const [minPrice, maxPrice] = priceFilter.split('-').map(p => parseInt(p));
            if (price < minPrice || price > maxPrice) {
                showProduct = false;
            }
        }
        
        if (showProduct) {
            product.style.display = 'block';
            visibleProducts.push(product);
        } else {
            product.style.display = 'none';
        }
    });
    
    // Show/hide no results message
    if (visibleProducts.length === 0) {
        noResults.style.display = 'block';
    } else {
        noResults.style.display = 'none';
    }
    
    // Sort products
    if (sortFilter !== 'default' && visibleProducts.length > 0) {
        const container = document.querySelector('.products-grid');
        
        visibleProducts.sort((a, b) => {
            const aTitle = a.querySelector('.product-title').textContent;
            const bTitle = b.querySelector('.product-title').textContent;
            const aPrice = parseInt(a.getAttribute('data-price'));
            const bPrice = parseInt(b.getAttribute('data-price'));
            
            switch (sortFilter) {
                case 'name-asc':
                    return aTitle.localeCompare(bTitle);
                case 'name-desc':
                    return bTitle.localeCompare(aTitle);
                case 'price-asc':
                    return aPrice - bPrice;
                case 'price-desc':
                    return bPrice - aPrice;
                default:
                    return 0;
            }
        });
        
        // Reorder DOM elements
        visibleProducts.forEach(product => {
            container.appendChild(product);
        });
    }
}