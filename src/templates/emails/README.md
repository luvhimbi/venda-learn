# Chommie Email Templates for Firebase

These templates are designed to work seamlessly with the **Firebase Trigger Email Extension**. They follow the **Chommie** brand identity with high-contrast amber accents and a "brutalist" 3D button style.

## Templates Included

1.  **`reset-password.html`**: For password recovery flows.
    *   **Variables**: `{{email}}`, `{{link}}`
2.  **`welcome.html`**: For high-energy onboarding.
    *   **Variables**: (None current, can be customized)
3.  **`notification.html`**: Generic multi-purpose notification.
    *   **Variables**: `{{title}}`, `{{message}}`, `{{actionLink}}`, `{{actionText}}`

## How to use with Firebase "Trigger Email"

1.  Open the Firebase Console and go to your **Trigger Email** extension configuration.
2.  In the **Templates Collection**, you can store these HTML strings.
3.  When writing to the `mail` collection in Firestore, specify the `template.name` and providing the necessary `template.data` (Handlebars variables).

### Example Firestore Document

```javascript
db.collection('mail').add({
  to: 'user@example.com',
  template: {
    name: 'reset-password',
    data: {
      email: 'user@example.com',
      link: 'https://chommie.com/reset-link-here'
    }
  }
});
```

## Customization

*   **Colors**: The primary accent is `#FACC15` (Amber Yellow).
*   **Logo**: Update the `<img>` src in the header with your permanent public logo URL.
*   **Styles**: All styles are contained within `<style>` blocks for maximum compatibility, though most email clients now support this, for older clients like Outlook 2013, you may want to use a CSS inliner.

---
**Your Chommie Team**
