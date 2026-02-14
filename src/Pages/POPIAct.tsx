import React from 'react';
import SmartReader from '../components/SmartReader';

const POPIAct: React.FC = () => {
    const popiText = `
        Protection of Personal Information Act (POPIA) Compliance.
        Last Updated: December 2025.

        1. Commitment to Privacy.
        Venda Learn is committed to protecting the privacy and rights of our users in accordance with the Protection of Personal Information Act 4 of 2013 ("POPIA"). We value your trust and are dedicated to processing your personal information lawfully, transparently, and securely.

        2. Information Officer.
        We have appointed an Information Officer who is responsible for encouraging compliance with POPIA. 
        Contact: privacy@vendalearn.com
        Address: [Physical Address Placeholder, Thohoyandou, South Africa]

        3. Lawful Processing of Personal Information.
        We only process personal information if:
        a) You consent to the processing;
        b) Processing is necessary to carry out actions for the conclusion or performance of a contract to which you are a party;
        c) Processing complies with an obligation imposed by law on us;
        d) Processing protects a legitimate interest of yours; or
        e) Processing is necessary for the proper performance of a public law duty by a public body.

        4. Purpose of Processing.
        We collect and process your personal information mainly to contact you for the purposes of understanding your requirements and delivering services accordingly. For this purpose, we will use your personal information:
        - To provide and maintain our Service;
        - To manage your registration as a user of the Service;
        - To contact you by email, telephone calls, SMS, or other equivalent forms of electronic communication;
        - To provide you with news, special offers, and general information about other goods, services, and events which we offer that are similar to those that you have already purchased or enquired about.

        5. Your Rights as a Data Subject.
        Under POPIA, you have the right to:
        5.1 Notification: You have the right to be notified that your personal information is being collected.
        5.2 Access: You have the right to establish whether we hold personal information of yours and to request access to your personal information.
        5.3 Correction relating to Personal Information: You have the right to request, where necessary, the correction, destruction, or deletion of your personal information.
        5.4 Objection: You have the right to object, on reasonable grounds relating to your particular situation to the processing of your personal information.
        5.5 Direct Marketing: You have the right to object to the processing of your personal information for purposes of direct marketing by means of unsolicited electronic communications.
        5.6 Automated Decision Making: You have the right not to be subject, under certain circumstances, to a decision which is based solely on the basis of the automated processing of your personal information intended to provide a profile of you.
        5.7 Review: You have the right to submit a complaint to the Information Regulator regarding the alleged interference with the protection of the personal information of any data subject or to submit a complaint to the Information Regulator in respect of a determination of an adjudicator.

        6. Security Measures.
        We secure the integrity and confidentiality of personal information in our possession or under our control by taking appropriate, reasonable technical and organisational measures to prevent loss of, damage to, or unauthorised destruction of personal information; and unlawful access to or processing of personal information. Our data is stored securely using Google Firebase services, ensuring industry-standard encryption and security protocols.

        7. International Transfer of Personal Information.
        We may transfer your personal information to recipients outside of the Republic of South Africa (e.g., cloud storage servers). We will strictly only transfer data to countries that have similar or better data protection laws than POPIA, or where we have entered into an agreement with the recipient to protect your data.

        8. Retention of Information.
        We will retain your personal information only for as long as is necessary for the purposes set out in this policy. We will retain and use your personal information to the extent necessary to comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies.

        9. Contact the Information Regulator.
        If you are unsatisfied with how we handle your personal information, you have the right to lodge a complaint with the Information Regulator of South Africa.
        Website: https://www.justice.gov.za/inforeg/
        Email: inforeg@justice.gov.za
    `;

    return (
        <div className="min-vh-100 bg-light py-5">
            <div className="container">
                <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1 className="fw-bold text-primary mb-0">POPI Act Compliance</h1>
                    </div>

                    <SmartReader
                        title="POPI Act (Full Audio)"
                        text={popiText}
                    />

                    <p className="lead text-muted mb-5 mt-4 text-center small">Committed to protecting your rights under South African Law.</p>
                </div>
            </div>
        </div>
    );
};

export default POPIAct;
