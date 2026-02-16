import React from 'react';
import SmartReader from '../../components/SmartReader';

const TermsOfUse: React.FC = () => {
    const termsText = `
        Terms of Use Agreement. 
        Last Updated: December 2025. 

        1. Acceptance of Terms. 
        Welcome to Venda Learn. By accessing or using our website, mobile application, or any other services provided by Venda Learn (collectively, the "Service"), you agree to be bound by these Terms of Use ("Terms"). If you do not agree to these Terms, do not use the Service. These Terms apply to all visitors, users, and others who access the Service.

        2. Changes to Terms.
        We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.

        3. Access and Use of the Service.
        3.1 Eligibility: You must be at least 13 years old to use the Service. By using the Service, you represent and warrant that you meet this eligibility requirement.
        3.2 User Accounts: To access certain features of the Service, you may be required to register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete. You are responsible for safeguarding your password and for all activities that occur under your account.
        3.3 Prohibited Conduct: You agree not to engage in any of the following prohibited activities: (i) copying, distributing, or disclosing any part of the Service in any medium, including without limitation by any automated or non-automated "scraping"; (ii) using any automated system, including without limitation "robots," "spiders," "offline readers," etc., to access the Service; (iii) transmitting spam, chain letters, or other unsolicited email; (iv) attempting to interfere with, compromise the system integrity or security or decipher any transmissions to or from the servers running the Service; (v) taking any action that imposes, or may impose at our sole discretion an unreasonable or disproportionately large load on our infrastructure; (vi) uploading invalid data, viruses, worms, or other software agents through the Service; (vii) collecting or harvesting any personally identifiable information, including account names, from the Service; (viii) using the Service for any commercial solicitation purposes; (ix) impersonating another person or otherwise misrepresenting your affiliation with a person or entity, conducting fraud, hiding or attempting to hide your identity; (x) interfering with the proper working of the Service; (xi) accessing any content on the Service through any technology or means other than those provided or authorized by the Service; or (xii) bypassing the measures we may use to prevent or restrict access to the Service, including without limitation features that prevent or restrict use or copying of any content or enforce limitations on use of the Service or the content therein.

        4. Intellectual Property Rights.
        The Service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of Venda Learn and its licensors. The Service is protected by copyright, trademark, and other laws of both South Africa and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Venda Learn.

        5. User Content.
        Our Service may allow you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("User Content"). You are responsible for the User Content that you post to the Service, including its legality, reliability, and appropriateness. By posting User Content to the Service, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such User Content on and through the Service. You retain any and all of your rights to any User Content you submit, post or display on or through the Service and you are responsible for protecting those rights.

        6. Termination.
        We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service.

        7. Limitation of Liability.
        In no event shall Venda Learn, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage, and even if a remedy set forth herein is found to have failed of its essential purpose.

        8. Disclaimer.
        Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.

        9. Governing Law.
        These Terms shall be governed and construed in accordance with the laws of South Africa, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.

        10. Contact Us.
        If you have any questions about these Terms, please contact us at help@vendalearn.com.
    `;

    return (
        <div className="min-vh-100 bg-light py-5">
            <div className="container">
                <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
                    <h1 className="fw-bold mb-4">Terms of Use</h1>

                    <SmartReader
                        title="Terms of Use (Full Audio)"
                        text={termsText}
                    />

                    <p className="text-muted mb-4 mt-4 text-center small">Last Updated: December 2025</p>
                </div>
            </div>
        </div>
    );
};

export default TermsOfUse;



