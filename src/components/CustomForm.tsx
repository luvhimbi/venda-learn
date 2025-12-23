import React, { useState } from "react";
import CustomButton from "./CustomButton";
import FormField from "./form/FormField";
import TextareaField from "./form/TextareaField";
import SelectField from "./form/SelectField";

function CustomForm() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        message: "",
        subject: ""
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form Data:", formData);
    };

    const subjectOptions = [
        { value: "general", label: "General Inquiry" },
        { value: "support", label: "Support" },
        { value: "feedback", label: "Feedback" }
    ];

    return (
        <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
            <h4 className="mb-3 fw-bold">Contact Us</h4>

            <FormField
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
            />

            <FormField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
            />

            <SelectField
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                options={subjectOptions}
                required
            />

            <TextareaField
                label="Message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                required
            />

            <CustomButton text="Submit" type="submit" variant="primary" />
        </form>
    );
}

export default CustomForm;
