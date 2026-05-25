import { LegalLayout } from "@/components/site/LegalLayout";
import { P, L } from "./_sections";
export default () => (
  <LegalLayout
    title="Cookie Policy"
    updated="February 28, 2026"
    intro="This Cookie Policy explains how NovaSafe uses cookies and similar technologies on novasafe.app and within our web application. We use as few cookies as we can reasonably get away with, and none of them are used for advertising."
    sections={[
      { id: "what", title: "What cookies are", body: <P>Cookies are small text files placed on your device when you visit a website. They are widely used to make sites work, to remember preferences, and to provide information to site owners. Similar technologies such as local storage and IndexedDB work in comparable ways, and we treat them under this policy where they perform a similar function.</P> },
      { id: "use", title: "How NovaSafe uses cookies", body: <>
        <P>We group cookies into two categories:</P>
        <L items={[
          "Strictly necessary — required to sign you in, keep you signed in, and protect the application against cross-site request forgery. These cannot be disabled without breaking the Service.",
          "Product analytics — used to understand how features are used in aggregate so we can improve them. These are disabled by default in the European Economic Area and the United Kingdom, and can be turned off from the cookie banner or in your account settings everywhere else.",
        ]} />
        <P>We do not use cookies for advertising. We do not embed third-party advertising tags. We do not sell or share information collected through cookies with advertising networks.</P>
      </> },
      { id: "manage", title: "Managing your preferences", body: <P>You can update your cookie preferences at any time from the cookie banner or from the privacy section of your account settings. Most browsers also allow you to block cookies entirely; if you do, the Service may not function as expected and you may not be able to sign in.</P> },
      { id: "contact", title: "Contact", body: <P>Questions about this policy can be sent to privacy@novasafe.app.</P> },
    ]} />
);
