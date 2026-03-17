import Swal from 'sweetalert2';

/**
 * Premium Popup Service for Venda Learn
 * Provides standardized, brand-consistent UI feedback using SweetAlert2.
 */
export const popupService = {
    /**
     * Show a premium success message
     */
    innerSuccess: (title: string, html: string = '', confirmText: string = 'Great!') => {
        return Swal.fire({
            title: title,
            html: html,
            icon: 'success',
            confirmButtonColor: '#FACC15',
            confirmButtonText: confirmText,
            customClass: {
                popup: 'rounded-5 border-0 shadow-lg p-4',
                title: 'fw-bold ls-tight',
                confirmButton: 'rounded-pill px-5 py-2 fw-bold text-dark ls-1'
            }
        });
    },

    /**
     * Show a premium definition/meaning popup
     */
    meaning: (title: string, text: string) => {
        return Swal.fire({
            title: title,
            text: text,
            icon: 'info',
            confirmButtonColor: '#FACC15',
            confirmButtonText: 'Got it!',
            customClass: {
                popup: 'rounded-5 border-0 shadow-lg p-4',
                title: 'fw-bold ls-tight',
                confirmButton: 'rounded-pill px-5 py-2 fw-bold text-dark ls-1'
            }
        });
    },

    /**
     * Show a premium error message
     */
    error: (title: string, text: string = 'Vha khou humbelwa u lingedza hafhu.') => {
        return Swal.fire({
            title: title,
            text: text,
            icon: 'error',
            confirmButtonColor: '#111827',
            confirmButtonText: 'OK',
            customClass: {
                popup: 'rounded-5 border-0 shadow-lg p-4',
                title: 'fw-bold ls-tight',
                confirmButton: 'rounded-pill px-5 py-2 fw-bold text-white ls-1'
            }
        });
    },

    /**
     * Show a premium confirmation dialog
     */
    confirm: (title: string, text: string, confirmText: string = 'Yes', cancelText: string = 'Cancel') => {
        return Swal.fire({
            title: title,
            text: text,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#FACC15',
            cancelButtonColor: '#111827',
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
            reverseButtons: true,
            customClass: {
                popup: 'rounded-5 border-0 shadow-lg p-4',
                title: 'fw-bold ls-tight text-dark',
                confirmButton: 'rounded-pill px-4 py-2 fw-bold text-dark ls-1',
                cancelButton: 'rounded-pill px-4 py-2 fw-bold text-white ls-1'
            }
        });
    },

    /**
     * Show a loading state
     */
    showLoading: (title: string = 'Please wait...') => {
        Swal.fire({
            title: title,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
            customClass: {
                popup: 'rounded-5 border-0 shadow-lg p-4',
                title: 'fw-bold ls-tight text-dark'
            }
        });
    },

    /**
     * Close any open Swal
     */
    close: () => {
        Swal.close();
    }
};
