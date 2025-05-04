// Integrated footer and modal functionality
document.addEventListener('DOMContentLoaded', function() {
    // ======== MODALS FUNCTIONALITY ========
    // Get all modal elements
    const supportCenterModal = document.getElementById('supportCenterModal');
    const termsModal = document.getElementById('termsModal');
    const privacyPolicyModal = document.getElementById('privacyPolicyModal');
    const helpModal = document.getElementById('helpModal');
    const faqsModal = document.getElementById('faqsModal');
    const returnsModal = document.getElementById('returnsModal');
    const shippingModal = document.getElementById('shippingModal');
    const deliveryTimeModal = document.getElementById('deliveryTimeModal');

    // Get all modal close buttons
    const closeButtons = document.querySelectorAll('.modal-close');

    // Functions to open and close modals
    function openModal(modal) {
        if (!modal) return; // Safety check for null modal
        closeAllModals(); // Close any open modals first
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
    }

    function closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = ''; // Restore scrolling
    }

    // Add event listeners to close buttons
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeAllModals();
        });
    });

    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeAllModals();
        }
    });

    // Handle FAQ interactivity
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const faqItem = this.parentElement;
            faqItem.classList.toggle('active');
        });
    });

    // Handle Delivery FAQ interactivity (specific for the delivery-time section)
    const deliveryFaqItems = document.querySelectorAll('.delivery-faq .faq-item');
    deliveryFaqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', function() {
                item.classList.toggle('active');

                // Toggle answer visibility
                const answer = item.querySelector('.faq-answer');
                if (answer) {
                    answer.style.display = item.classList.contains('active') ? 'block' : 'none';
                }

                // Toggle icon rotation
                const icon = this.querySelector('.faq-toggle i');
                if (icon) {
                    if (item.classList.contains('active')) {
                        icon.classList.remove('fa-chevron-down');
                        icon.classList.add('fa-chevron-up');
                    } else {
                        icon.classList.remove('fa-chevron-up');
                        icon.classList.add('fa-chevron-down');
                    }
                }
            });
        }
    });

    // Handle FAQ category filtering
    const faqCategories = document.querySelectorAll('.faq-category');
    const faqItems = document.querySelectorAll('.faq-item:not(.delivery-faq .faq-item)'); // Exclude delivery FAQs

    faqCategories.forEach(category => {
        category.addEventListener('click', function() {
            // Remove active class from all categories
            faqCategories.forEach(cat => cat.classList.remove('active'));

            // Add active class to clicked category
            this.classList.add('active');

            const selectedCategory = this.getAttribute('data-category');

            // Show/hide FAQ items based on category
            faqItems.forEach(item => {
                if (selectedCategory === 'all' || item.getAttribute('data-category') === selectedCategory) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // Handle FAQ search functionality
    const faqSearch = document.getElementById('faqSearch');
    if (faqSearch) {
        faqSearch.addEventListener('input', function() {
            const searchValue = this.value.toLowerCase();

            faqItems.forEach(item => {
                const questionText = item.querySelector('.faq-question h3, .faq-question h4').textContent.toLowerCase();
                const answerText = item.querySelector('.faq-answer p').textContent.toLowerCase();

                if (questionText.includes(searchValue) || answerText.includes(searchValue)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    // Remove existing support-section if it exists (since we're moving to modal)
    const existingSupportSection = document.querySelector('.support-section');
    if (existingSupportSection) {
        existingSupportSection.remove();
    }

    // Support Center modal video handling
    const supportVideo = supportCenterModal ? supportCenterModal.querySelector('.support-video') : null;
    if (supportVideo) {
        // Pause video when modal closes
        closeButtons.forEach(button => {
            if (button.closest('#supportCenterModal')) {
                button.addEventListener('click', function() {
                    supportVideo.pause();
                });
            }
        });

        // Pause video when clicking outside modal
        window.addEventListener('click', function(event) {
            if (event.target === supportCenterModal) {
                supportVideo.pause();
            }
        });
    }

    // Initialize delivery time modal FAQs to be collapsed by default
    const deliveryFAQs = document.querySelectorAll('#deliveryTimeModal .faq-answer');
    if (deliveryFAQs) {
        deliveryFAQs.forEach(answer => {
            answer.style.display = 'none';
        });
    }

    // ======== FOOTER FUNCTIONALITY ========
    // Get all footer links
    const footerLinks = document.querySelectorAll('footer .links a');

    // Add direct click handler for any "Estimated Delivery Time" link that might exist
    const estimatedDeliveryTimeLinks = document.querySelectorAll('a[href="#deliveryTimeModal"], a[href="#estimated-delivery-time"]');
    estimatedDeliveryTimeLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            openModal(deliveryTimeModal);
        });
    });

    // Add event listeners to each footer link
    footerLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            const linkText = this.textContent.trim().replace(/^\s*\u25B6\s*/, '').trim();
            const hrefValue = this.getAttribute('href') ? this.getAttribute('href').substring(1) : '';

            // Check if it's a service link (modal) or a category link
            if (linkText === 'Support Center') {
                openModal(supportCenterModal);
                // Play video when modal opens
                if (supportVideo) {
                    supportVideo.play();
                }
                return;
            } else if (linkText === 'Terms & Conditions') {
                openModal(termsModal);
                return;
            } else if (linkText === 'Privacy Policy') {
                openModal(privacyPolicyModal);
                return;
            } else if (linkText === 'Help') {
                openModal(helpModal);
                return;
            } else if (linkText === 'FAQs' || linkText === 'FAQS') {
                openModal(faqsModal);
                return;
            } else if (linkText === 'Returns & Exchanges') {
                openModal(returnsModal);
                return;
            } else if (linkText === 'Shipping & Delivery') {
                openModal(shippingModal);
                return;
            } else if (linkText === 'Delivery Time' ||
                linkText === 'Estimated Delivery Time' ||
                linkText === 'Delivery Estimates') {
                openModal(deliveryTimeModal);
                return;
            } else if (hrefValue === 'deliveryTimeModal' ||
                hrefValue === 'delivery-time' ||
                hrefValue === 'estimated-delivery-time') {
                openModal(deliveryTimeModal);
                return;
            }

            // If not a modal link, handle as category navigation
            let category;

            // Map the footer link text to category values matching your select box
            switch(linkText) {
                case 'Used Items':
                    category = 'Used Items';
                    break;
                case 'Upper_Limb': // Corrected from 'Limb'
                    category = 'Upper_Limb' // Keep original format for compatibility
                    break;F
                case 'Lower_Limb': // Corrected from 'Limb'
                    category = 'Lower_Limb'; // Keep original format for compatibility
                    break;
                case 'Accessories':
                    category = 'Accessories';
                    break;
                default:
                    // Use the href value as a fallback
                    category = hrefValue;
            }

            // Redirect to products page with category parameter
            if (category) {
                window.location.href = 'products.html?category=' + encodeURIComponent(category);
            }
        });
    });

    // Add click handler for any other Estimated Delivery Time links throughout the site
    document.addEventListener('click', function(e) {
        const target = e.target;
        if (target.tagName === 'A' || target.closest('a')) {
            const link = target.tagName === 'A' ? target : target.closest('a');
            const linkText = link.textContent.trim();

            if (linkText === 'Estimated Delivery Time' ||
                link.getAttribute('href') === '#deliveryTimeModal' ||
                link.getAttribute('href') === '#estimated-delivery-time') {
                e.preventDefault();
                openModal(deliveryTimeModal);
            }
        }
    });

    // Handle select box change if we're on the products page
    const categorySelect = document.getElementById('category');
    if (categorySelect) {
        // Set the initial value from URL parameter if exists
        const urlParams = new URLSearchParams(window.location.search);
        const categoryParam = urlParams.get('category');

        if (categoryParam) {
            categorySelect.value = categoryParam;
        }

        // Add change event listener
        categorySelect.addEventListener('change', function() {
            window.location.href = 'products.html?category=' + encodeURIComponent(this.value);
        });
    }
});

// Find the Terms & Conditions link in the footer and add a direct event listener
document.addEventListener('DOMContentLoaded', function() {
    // Get the Terms & Conditions link from the footer
    const termsLink = Array.from(document.querySelectorAll('footer a[href="#Term_Conditions"], footer a[href="#term-conditions"]'))
        .find(link => link.textContent.includes("Term & Conditions"));

    // If the link exists, add a click event listener to open the terms modal
    if (termsLink) {
        termsLink.addEventListener('click', function(e) {
            e.preventDefault();
            const termsModal = document.getElementById('termsModal');
            if (termsModal) {
                // Close any open modals first
                const modals = document.querySelectorAll('.modal');
                modals.forEach(modal => {
                    modal.style.display = 'none';
                });

                // Open the terms modal
                termsModal.style.display = 'block';
                document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
            }
        });
    }

    // Additional fix for specific "Term & Conditions" text (note the singular "Term")
    const termLinks = document.querySelectorAll('footer .links a');
    termLinks.forEach(link => {
        if (link.textContent.trim().replace(/^\s*\u25B6\s*/, '').trim() === 'Term & Conditions') {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const termsModal = document.getElementById('termsModal');
                if (termsModal) {
                    // Close any open modals first
                    const modals = document.querySelectorAll('.modal');
                    modals.forEach(modal => {
                        modal.style.display = 'none';
                    });

                    // Open the terms modal
                    termsModal.style.display = 'block';
                    document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
                }
            });
        }
    });
});
