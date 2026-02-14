import React from 'react';
import SmartReader from '../components/SmartReader';

const PrivacyPolicy: React.FC = () => {
    const privacyText = `
        Privacy Policy.
        Last Updated: December 2025.

        1. Introduction.
        Venda Learn ("we," "us," or "our") respects the privacy of our users ("user" or "you"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and mobile application (the "Service"). Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the Service.

        2. Collection of Your Information.
        We may collect information about you in a variety of ways. The information we may collect via the Service includes:
        2.1 Personal Data: Personally identifiable information, such as your name, email address, and demographic information that you voluntarily give to us when you register with the Service or when you choose to participate in various activities related to the Service, such as online chat and message boards. You are under no obligation to provide us with personal information of any kind, however your refusal to do so may prevent you from using certain features of the Service.
        2.2 Derivative Data: Information our servers automatically collect when you access the Service, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Service.
        2.3 Financial Data: Financial information, such as data related to your payment method (e.g., valid credit card number, card brand, expiration date) that we may collect when you purchase, order, return, exchange, or request information about our services from the Service. We store only very limited, if any, financial information that we collect. Otherwise, all financial information is stored by our payment processor, and you are encouraged to review their privacy policy and contact them directly for responses to your questions.

        3. Use of Your Information.
        Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Service to:
        - Create and manage your account.
        - Compile anonymous statistical data and analysis for use internally or with third parties.
        - Email you regarding your account or order.
        - Enable user-to-user communications.
        - Fulfill and manage purchases, orders, payments, and other transactions related to the Service.
        - Generate a personal profile about you to make future visits to the Service more personalized.
        - Increase the efficiency and operation of the Service.
        - Monitor and analyze usage and trends to improve your experience with the Service.
        - Notify you of updates to the Service.
        - Offer new products, services, and/or recommendations to you.
        - Perform other business activities as needed.
        - Prevent fraudulent transactions, monitor against theft, and protect against criminal activity.
        - Process payments and refunds.
        - Request feedback and contact you about your use of the Service.
        - Resolve disputes and troubleshoot problems.
        - Respond to product and customer service requests.
        - Send you a newsletter.
        - Solicit support for the Service.

        4. Disclosure of Your Information.
        We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
        4.1 By Law or to Protect Rights: If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.
        4.2 Third-Party Service Providers: We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance. 
        4.3 Marketing Communications: With your consent, or with an opportunity for you to withdraw consent, we may share your information with third parties for marketing purposes, as permitted by law.
        4.4 Online Postings: When you post comments, contributions or other content to the Service, your posts may be viewed by all users and may be publicly distributed outside the Service in perpetuity.

        5. Security of Your Information.
        We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse. Any information disclosed online is vulnerable to interception and misuse by unauthorized parties. Therefore, we cannot guarantee complete security if you provide personal information.

        6. Policy for Children.
        We do not knowingly solicit information from or market to children under the age of 13. If you become aware that any data we have collected is from children under the age of 13, please contact us using the contact information provided below.

        7. Contact Us.
        If you have questions or comments about this Privacy Policy, please contact us at: privacy@vendalearn.com.
    `;

    return (
        <div className="min-vh-100 bg-light py-5">
            <div className="container">
                <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
                    <h1 className="fw-bold mb-4">Privacy Policy</h1>

                    <SmartReader
                        title="Privacy Policy (Full Audio)"
                        text={privacyText}
                    />

                    <p className="text-muted mb-5 mt-4 text-center small">Values Transparency. Your privacy is our priority.</p>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
