import React from 'react';
import SmartReader from '../../components/SmartReader';

const DMCA: React.FC = () => {
    const dmcaText = `
        DMCA Policy (Digital Millennium Copyright Act).
        Last Updated: December 2025.

        1. Introduction.
        Venda Learn ("we," "us," or "our") respects the intellectual property rights of others and expects our users to do the same. In accordance with the Digital Millennium Copyright Act (DMCA), we will respond expeditiously to claims of copyright infringement committed using the Venda Learn service (the "Service") that are reported to our Designated Copyright Agent.

        2. Notice of Infringement.
        If you are a copyright owner, or are authorized to act on behalf of one, please report alleged copyright infringements taking place on or through the Service by completing a DMCA Notice of Alleged Infringement and delivering it to our Designated Copyright Agent. Upon receipt of a valid notice, we will take whatever action, in our sole discretion, we deem appropriate, including removal of the challenged material from the Service.

        3. DMCA Notice Requirements.
        Your DMCA Notice must include the following information:
        - Identify the copyrighted work that you claim has been infringed.
        - Identify the material that you claim is infringing and that is to be removed or access to which is to be disabled, and information reasonably sufficient to permit us to locate the material (e.g., URL).
        - Provide your contact information, including your address, telephone number, and email address.
        - Include a statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.
        - Include a statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.
        - Provide your physical or electronic signature.

        4. Designated Copyright Agent.
        Please send your DMCA Notice to:
        Designated Agent: Venda Learn Legal Team
        Email: yonalisa514@gmail.com
        Address: South Africa Gauteng

        5. Counter-Notification.
        If you receive a notification that your content has been removed due to a copyright complaint, you may file a counter-notification by sending a written communication to our Designated Copyright Agent that includes:
        - Identification of the material that has been removed or to which access has been disabled and the location at which the material appeared before it was removed or access to it was disabled.
        - A statement under penalty of perjury that you have a good faith belief that the material was removed or disabled as a result of mistake or misidentification of the material.
        - Your name, address, and telephone number, and a statement that you consent to the jurisdiction of the Federal District Court for the judicial district in which the address is located.
        - Your physical or electronic signature.

        6. Repeat Infringers.
        It is our policy in appropriate circumstances to disable and/or terminate the accounts of users who are repeat infringers.
    `;

    return (
        <div className="min-vh-100 bg-light py-5">
            <div className="container">
                <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
                    <h1 className="fw-bold mb-4">DMCA Policy</h1>

                    <SmartReader
                        title="DMCA Policy (Full Audio)"
                        text={dmcaText}
                    />

                    <p className="text-muted mb-5 mt-4 text-center small">Protecting intellectual property with integrity.</p>
                </div>
            </div>
        </div>
    );
};

export default DMCA;
