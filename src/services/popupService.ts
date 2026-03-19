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
            background: '#ffffff',
            showClass: {
                popup: 'animate__animated animate__fadeInDown animate__faster'
            },
            hideClass: {
                popup: 'animate__animated animate__fadeOutUp animate__faster'
            },
            customClass: {
                popup: 'rounded-5 border-0 shadow-2xl p-4 p-md-5',
                title: 'fw-bold ls-tight fs-3 mb-3 text-dark',
                confirmButton: 'btn btn-warning rounded-pill px-5 py-3 fw-bold text-dark ls-1 border-0 shadow-sm'
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
            background: '#ffffff',
            customClass: {
                popup: 'rounded-5 border-0 shadow-2xl p-4 p-md-5',
                title: 'fw-bold ls-tight fs-3 mb-3 text-dark',
                confirmButton: 'btn btn-warning rounded-pill px-5 py-3 fw-bold text-dark ls-1 border-0 shadow-sm'
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
            confirmButtonColor: '#1e293b',
            confirmButtonText: 'OK',
            background: '#ffffff',
            customClass: {
                popup: 'rounded-5 border-0 shadow-2xl p-4 p-md-5',
                title: 'fw-bold ls-tight fs-3 mb-3 text-danger',
                confirmButton: 'btn btn-dark rounded-pill px-5 py-3 fw-bold text-white ls-1 border-0 shadow-sm'
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
            cancelButtonColor: '#1e293b',
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
            reverseButtons: true,
            background: '#ffffff',
            customClass: {
                popup: 'rounded-5 border-0 shadow-2xl p-4 p-md-5',
                title: 'fw-bold ls-tight fs-3 mb-3 text-dark',
                confirmButton: 'btn btn-warning rounded-pill px-4 py-3 fw-bold text-dark ls-1 border-0 shadow-sm mx-2',
                cancelButton: 'btn btn-outline-dark border-2 rounded-pill px-4 py-3 fw-bold text-dark ls-1 mx-2'
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
            background: '#ffffff',
            didOpen: () => {
                Swal.showLoading();
            },
            customClass: {
                popup: 'rounded-5 border-0 shadow-2xl p-4 p-md-5',
                title: 'fw-bold ls-tight fs-4 text-dark'
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
