<script setup>
const props = defineProps({
  isOpen: Boolean,
});
const emit = defineEmits(["close"]);
</script>

<template>
  <div
        v-if="isOpen"
        class="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
        @click.self="emit('close')"
    >
        <div
        class="bg-gray-800 border border-gray-400 rounded-2xl w-11/12 md:w-3/4 lg:w-1/2 max-h-[80vh] overflow-y-auto p-6 relative"
        data-aos="fade-up"
        data-aos-delay="300"
        >
        <section class="py-10 bg-opacity-50 backdrop-blur-sm">
            <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <!-- Privacy Policy -->
            <div class="bg-gray-100 p-8 rounded-2xl shadow mb-10">
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                Privacy Policy
                </h2>

                <p class="text-gray-700 leading-relaxed mb-4">
                <strong>Last updated November 19, 2025</strong>
                </p>

                <p class="text-gray-700 leading-relaxed mb-4">
                This Privacy Notice for
                <strong>TQRandom</strong>, describe how and why we might access, collect,
                store, use, and/or share ("process") your personal
                information when you use our services ("Services"),
                including when you:
                </p>

                <ul
                class="list-disc pl-6 text-gray-700 leading-relaxed mb-4"
                >
                <li>
                    Visit our website at
                    <strong>tq-random.vercel.app</strong> or any website
                    of ours that links to this Privacy Notice.
                </li>
                <li>
                    Use TQRandom. TQRandom is a web application created to
                    help instructors easily prepare randomized test
                    questionnaires. It was built with one goal in mind: to
                    reduce cheating and save time by generating multiple
                    clean, shuffled versions of tests for classroom
                    assessments.
                </li>
                <li>
                    Engage with us in other related ways, including any
                    sales, marketing, or events.
                </li>
                </ul>

                <p class="text-gray-700 leading-relaxed mb-4">
                <strong>Questions or concerns?</strong> Reading this
                Privacy Notice will help you understand your privacy
                rights and choices. We are responsible for making
                decisions about how your personal information is
                processed. If you do not agree with our policies and
                practices, please do not use our Services. If you still
                have any questions or concerns, please contact us at:
                </p>

                <p class="text-gray-700 leading-relaxed">
                <a
                    href="mailto:joshuatubo4@gmail.com"
                    class="text-blue-600 underline"
                >
                    joshuatubo4@gmail.com
                </a>
                ,
                <a
                    href="mailto:clarkboncales115@gmail.com"
                    class="text-blue-600 underline"
                >
                    clarkboncales115@gmail.com
                </a>
                </p>
            </div>
            <!-- Summary of Key Points -->
            <div class="bg-gray-100 p-8 rounded-2xl shadow mb-10">
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                Summary of Key Points
                </h2>

                <p class="text-gray-700 leading-relaxed mb-4">
                This summary provides key points from our Privacy
                Notice, but you can find out more details about any of
                these topics by clicking the linked items below or by
                using our
                <a
                    href="#table-of-contents"
                    class="text-blue-600 underline"
                >
                    table of contents.
                </a>
                </p>

                <p class="text-gray-700 leading-relaxed mb-4">
                <strong
                    >What personal information do we process?</strong
                >
                When you visit, use, or navigate our Services, we may
                process personal information depending on how you
                interact with us and the Services, the choices you make,
                and the products and features you use.
                <a
                    href="#personal-information"
                    class="text-blue-600 underline"
                >
                    Learn more about personal information you disclose to
                    us.
                </a>
                </p>

                <p class="text-gray-700 leading-relaxed mb-4">
                <strong
                    >Do we process any sensitive personal
                    information?</strong
                >
                Some of the information may be considered "special" or
                "sensitive" in certain jurisdictions (e.g., racial or
                ethnic origins, sexual orientation, religious beliefs).
                We do <strong>not</strong> process sensitive personal
                information.
                </p>

                <p class="text-gray-700 leading-relaxed mb-4">
                <strong
                    >Do we collect any information from third
                    parties?</strong
                >
                We do not collect any information from third parties.
                </p>

                <p class="text-gray-700 leading-relaxed mb-4">
                <strong>How do we process your information?</strong>
                We process your information to provide, improve, and
                administer our Services, communicate with you, ensure
                security and fraud prevention, and comply with the law.
                We may also process your information for other purposes
                with your consent. We process your information only when
                we have a valid legal reason to do so.
                <a
                    href="#how-we-process"
                    class="text-blue-600 underline"
                >
                    Learn more about how we process your information.
                </a>
                </p>

                <p class="text-gray-700 leading-relaxed mb-4">
                <strong
                    >In what situations and with which parties do we share
                    personal information?</strong
                >
                We may share personal information in specific situations
                and with specific third parties.
                <a
                    href="#share-information"
                    class="text-blue-600 underline"
                >
                    Learn more about when and with whom we share your
                    personal information.
                </a>
                </p>

                <p class="text-gray-700 leading-relaxed mb-4">
                <strong>How do we keep your information safe?</strong>
                We use organizational and technical measures to protect
                your information. However, no electronic transmission or
                storage system is 100% secure, and we cannot guarantee
                that unauthorized parties will never access your data.
                <a
                    href="#information-safety"
                    class="text-blue-600 underline"
                >
                    Learn more about how we keep your information safe.
                </a>
                </p>

                <p class="text-gray-700 leading-relaxed mb-4">
                <strong>What are your rights?</strong>
                Privacy laws in your region may give you certain rights
                regarding your personal information.
                <a
                    href="#privacy-rights"
                    class="text-blue-600 underline"
                >
                    Learn more about your privacy rights.
                </a>
                </p>

                <p class="text-gray-700 leading-relaxed mb-4">
                <strong>How do you exercise your rights?</strong>
                The easiest way is by visiting
                <strong>tq-random.vercel.app</strong> or contacting us
                directly. We will act on your request in accordance with
                applicable laws.
                </p>

                <p class="text-gray-700 leading-relaxed">
                <strong
                    >Want to learn more about what we do with any
                    information we collect?</strong
                >
                <a href="#full-notice" class="text-blue-600 underline">
                    Review the Privacy Notice in full.
                </a>
                </p>
            </div>
            <!-- TABLE OF CONTENTS -->
            <div
                id="table-of-contents"
                class="bg-gray-100 p-8 rounded-2xl shadow mb-10"
            >
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                Table of Contents
                </h2>

                <ol
                class="list-decimal pl-6 text-gray-700 space-y-2 leading-relaxed"
                >
                <li>
                    <a
                    href="#what-information-we-collect"
                    class="text-blue-600 underline"
                    >
                    WHAT INFORMATION DO WE COLLECT?
                    </a>
                </li>

                <li>
                    <a
                    href="#how-we-process-information"
                    class="text-blue-600 underline"
                    >
                    HOW DO WE PROCESS YOUR INFORMATION?
                    </a>
                </li>

                <li>
                    <a
                    href="#share-personal-information"
                    class="text-blue-600 underline"
                    >
                    WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL
                    INFORMATION?
                    </a>
                </li>

                <li>
                    <a
                    href="#social-logins"
                    class="text-blue-600 underline"
                    >
                    HOW DO WE HANDLE YOUR SOCIAL LOGINS?
                    </a>
                </li>

                <li>
                    <a
                    href="#information-retention"
                    class="text-blue-600 underline"
                    >
                    HOW LONG DO WE KEEP YOUR INFORMATION?
                    </a>
                </li>

                <li>
                    <a
                    href="#information-safety"
                    class="text-blue-600 underline"
                    >
                    HOW DO WE KEEP YOUR INFORMATION SAFE?
                    </a>
                </li>

                <li>
                    <a
                    href="#minors-data"
                    class="text-blue-600 underline"
                    >
                    DO WE COLLECT INFORMATION FROM MINORS?
                    </a>
                </li>

                <li>
                    <a
                    href="#privacy-rights"
                    class="text-blue-600 underline"
                    >
                    WHAT ARE YOUR PRIVACY RIGHTS?
                    </a>
                </li>

                <li>
                    <a
                    href="#do-not-track"
                    class="text-blue-600 underline"
                    >
                    CONTROLS FOR DO-NOT-TRACK FEATURES
                    </a>
                </li>

                <li>
                    <a
                    href="#regional-rights"
                    class="text-blue-600 underline"
                    >
                    DO OTHER REGIONS HAVE SPECIFIC PRIVACY RIGHTS?
                    </a>
                </li>

                <li>
                    <a
                    href="#data-handling-questionnaires"
                    class="text-blue-600 underline"
                    >
                    DATA HANDLING OF UPLOADED QUESTIONNAIRES
                    </a>
                </li>

                <li>
                    <a
                    href="#student-anonymity"
                    class="text-blue-600 underline"
                    >
                    STUDENT ANONYMITY
                    </a>
                </li>

                <li>
                    <a
                    href="#limitations-third-party"
                    class="text-blue-600 underline"
                    >
                    LIMITATIONS ON THIRD-PARTY SHARING
                    </a>
                </li>

                <li>
                    <a
                    href="#updates-to-notice"
                    class="text-blue-600 underline"
                    >
                    DO WE MAKE UPDATES TO THIS NOTICE?
                    </a>
                </li>

                <li>
                    <a
                    href="#contact-about-notice"
                    class="text-blue-600 underline"
                    >
                    HOW CAN YOU CONTACT US ABOUT THIS NOTICE?
                    </a>
                </li>

                <li>
                    <a
                    href="#review-update-delete"
                    class="text-blue-600 underline"
                    >
                    HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE
                    COLLECT FROM YOU?
                    </a>
                </li>
                </ol>
            </div>
            <!-- 1. WHAT INFORMATION DO WE COLLECT -->
            <div
                id="what-information-we-collect"
                class="bg-gray-100 p-8 rounded-2xl shadow mb-10 scroll-mt-24"
            >
                <h2
                class="text-gray-700 leading-relaxed text-2xl font-bold mb-4"
                >
                1. WHAT INFORMATION DO WE COLLECT?
                </h2>

                <h3
                class="text-gray-700 leading-relaxed text-lg font-semibold mb-2"
                >
                Personal information you disclose to us
                </h3>

                <p class="text-gray-700 leading-relaxed mb-4">
                <strong>In Short:</strong> We collect personal
                information that you provide to us.
                </p>

                <p class="text-gray-700 leading-relaxed mb-4">
                We collect personal information that you voluntarily
                provide to us when you register on the Services, express
                an interest in obtaining information about us or our
                products and Services, when you participate in
                activities on the Services, or otherwise when you
                contact us.
                </p>

                <p class="text-gray-700 leading-relaxed mb-4">
                <strong>Personal Information Provided by You.</strong>
                The personal information that we collect depends on the
                context of your interactions with us and the Services,
                the choices you make, and the products and features you
                use. The personal information we collect may include the
                following:
                </p>

                <ul class="list-disc pl-5 space-y-1">
                <li>names</li>
                <li>phone numbers</li>
                <li>email addresses</li>
                <li>usernames</li>
                <li>passwords</li>
                </ul>
                <p class="text-gray-700 leading-relaxed mb-2">
                <strong>Sensitive Information:</strong> We do not
                process sensitive information.
                </p>

                <p class="text-gray-700 leading-relaxed mb-2">
                <strong>Social Media Login Data:</strong> We may provide
                you with the option to register with us using your
                existing social media account details, like your
                Facebook, X, or other social media account. If you
                choose to register in this way, we will collect certain
                profile information about you from the social media
                provider, as described in the section called
                <a href="#social-logins" class="text-blue-600 underline"
                    >"HOW DO WE HANDLE YOUR SOCIAL LOGINS?"</a
                >.
                </p>

                <p class="text-gray-700 leading-relaxed">
                All personal information that you provide to us must be
                true, complete, and accurate, and you must notify us of
                any changes to such personal information.
                </p>
            </div>
            <!-- 2. HOW DO WE PROCESS YOUR INFORMATION? -->
            <div
                id="how-we-process-information"
                class="bg-gray-100 p-8 rounded-2xl shadow mb-10 scroll-mt-20"
            >
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                2. HOW DO WE PROCESS YOUR INFORMATION?
                </h2>

                <p class="text-gray-700 leading-relaxed mb-2">
                <strong>In Short:</strong> We process your information
                to provide, improve, and administer our Services,
                communicate with you, for security and fraud prevention,
                and to comply with law. We may also process your
                information for other purposes with your consent.
                </p>

                <p class="text-gray-700 leading-relaxed mb-2">
                We process your personal information for a variety of
                reasons, depending on how you interact with our
                Services, including:
                </p>

                <ul class="list-disc pl-6 text-gray-700 mb-4">
                <li>
                    To facilitate account creation and authentication and
                    otherwise manage user accounts.
                </li>
                <li>
                    To deliver and facilitate delivery of services to the
                    user.
                </li>
                <li>
                    To respond to user inquiries/offer support to users.
                </li>
                <li>To send administrative information to you.</li>
                <li>To request feedback.</li>
                <li>To protect our Services.</li>
                <li>
                    To evaluate and improve our Services, products,
                    marketing, and your experience.
                </li>
                <li>To identify usage trends.</li>
                </ul>
            </div>
            <!-- 3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION? -->
            <div
                id="share-personal-information"
                class="bg-gray-100 p-8 rounded-2xl shadow mb-10 scroll-mt-20"
            >
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL
                INFORMATION?
                </h2>

                <p class="text-gray-700 leading-relaxed mb-2">
                <strong>In Short:</strong> We may share information in
                specific situations described in this section and/or
                with the following third parties.
                </p>

                <p class="text-gray-700 leading-relaxed mb-4">
                We may need to share your personal information in the
                following situations:
                </p>

                <ul class="list-disc pl-6 text-gray-700 mb-4">
                <li>
                    <strong>Business Transfers:</strong> We may share or
                    transfer your information in connection with, or
                    during negotiations of, any merger, sale of company
                    assets, financing, or acquisition of all or a portion
                    of our business to another company.
                </li>
                </ul>
            </div>

            <!-- 4. HOW DO WE HANDLE YOUR SOCIAL LOGINS? -->
            <div
                id="social-logins"
                class="bg-gray-100 p-8 rounded-2xl shadow mb-10 scroll-mt-20"
            >
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                4. HOW DO WE HANDLE YOUR SOCIAL LOGINS?
                </h2>

                <p class="text-gray-700 leading-relaxed mb-2">
                <strong>In Short:</strong> If you choose to register or
                log in to our Services using a social media account, we
                may have access to certain information about you.
                </p>

                <p class="text-gray-700 leading-relaxed mb-2">
                Our Services offer you the ability to register and log
                in using your third-party social media account details
                (like your Facebook or X logins). Where you choose to do
                this, we will receive certain profile information about
                you from your social media provider.
                </p>

                <p class="text-gray-700 leading-relaxed mb-2">
                The profile information we receive may vary depending on
                the social media provider concerned, but will often
                include your name, email address, friends list, and
                profile picture, as well as other information you choose
                to make public.
                </p>

                <p class="text-gray-700 leading-relaxed">
                We will use the information we receive only for the
                purposes described in this Privacy Notice or that are
                otherwise made clear to you on the relevant Services. We
                do not control other uses of your personal information
                by the third-party provider. Please review their privacy
                notice for details.
                </p>
            </div>

            <!-- 5. HOW LONG DO WE KEEP YOUR INFORMATION? -->
            <div
                id="information-retention"
                class="bg-gray-100 p-8 rounded-2xl shadow mb-10 scroll-mt-20"
            >
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                5. HOW LONG DO WE KEEP YOUR INFORMATION?
                </h2>

                <p class="text-gray-700 leading-relaxed mb-2">
                <strong>In Short:</strong> We keep your information for
                as long as necessary to fulfill the purposes outlined in
                this Privacy Notice unless otherwise required by law.
                </p>

                <p class="text-gray-700 leading-relaxed mb-2">
                We will only keep your personal information for as long
                as necessary for the purposes set out in this Privacy
                Notice, unless a longer retention period is required or
                permitted by law (e.g., tax, accounting, or other legal
                requirements). No purpose will require us keeping your
                personal information longer than the period users have
                an account with us.
                </p>

                <p class="text-gray-700 leading-relaxed">
                When we have no ongoing legitimate business need to
                process your personal information, we will either delete
                or anonymize such information, or if not possible (e.g.,
                stored in backup archives), we will securely store it
                and isolate it from further processing until deletion is
                possible.
                </p>
            </div>

            <!-- 6. HOW DO WE KEEP YOUR INFORMATION SAFE? -->
            <div
                id="information-safety"
                class="bg-gray-100 p-8 rounded-2xl shadow mb-10 scroll-mt-20"
            >
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                6. HOW DO WE KEEP YOUR INFORMATION SAFE?
                </h2>

                <p class="text-gray-700 leading-relaxed mb-2">
                <strong>In Short:</strong> We aim to protect your
                personal information through a system of organizational
                and technical security measures.
                </p>

                <p class="text-gray-700 leading-relaxed mb-2">
                We have implemented appropriate and reasonable technical
                and organizational security measures designed to protect
                the security of any personal information we process.
                </p>

                <p class="text-gray-700 leading-relaxed">
                Despite our safeguards, no electronic transmission over
                the Internet or information storage technology can be
                guaranteed 100% secure, so we cannot promise that
                hackers, cybercriminals, or other unauthorized parties
                will not access your information. Transmission to and
                from our Services is at your own risk. Access the
                Services only in a secure environment.
                </p>
            </div>
            <!-- 7. DO WE COLLECT INFORMATION FROM MINORS? -->
            <div
                id="minors-data"
                class="bg-gray-100 p-8 rounded-2xl shadow mb-10 scroll-mt-20"
            >
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                7. DO WE COLLECT INFORMATION FROM MINORS?
                </h2>

                <p class="text-gray-700 leading-relaxed">
                <strong>In Short:</strong> We do not knowingly collect
                data from or market to minors.
                </p>
            </div>

            <!-- 8. WHAT ARE YOUR PRIVACY RIGHTS? -->
            <div
                id="privacy-rights"
                class="bg-gray-100 p-8 rounded-2xl shadow mb-10 scroll-mt-20"
            >
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                8. WHAT ARE YOUR PRIVACY RIGHTS?
                </h2>

                <p class="text-gray-700 leading-relaxed mb-2">
                <strong>In Short:</strong> You may review, change, or
                terminate your account at any time, depending on your
                country, province, or state of residence.
                </p>

                <p class="text-gray-700 leading-relaxed">
                <strong>Withdrawing your consent:</strong> If we are
                relying on your consent to process your personal
                information (express and/or implied depending on the
                law), you have the right to withdraw your consent at any
                time. You can withdraw your consent by contacting us
                using the details provided in the section
                <a
                    href="#contact-about-notice"
                    class="text-blue-600 underline"
                    >"HOW CAN YOU CONTACT US ABOUT THIS NOTICE?"</a
                >below.
                </p>

                <p class="text-gray-700 leading-relaxed">
                Please note that withdrawing consent will not affect the
                lawfulness of the processing prior to withdrawal, nor
                will it affect processing conducted on other lawful
                grounds.
                </p>
            </div>
            <!-- 9. CONTROLS FOR DO-NOT-TRACK FEATURES -->
            <div
                id="do-not-track"
                class="bg-gray-100 p-8 rounded-2xl shadow mb-10 scroll-mt-20"
            >
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                9. CONTROLS FOR DO-NOT-TRACK FEATURES
                </h2>

                <p class="text-gray-700 leading-relaxed">
                Most web browsers and some mobile operating systems and
                mobile applications include a Do-Not-Track ("DNT")
                feature or setting you can activate to signal your
                privacy preference not to have data about your online
                browsing activities monitored and collected.
                </p>

                <p class="text-gray-700 leading-relaxed mb-2">
                No uniform technology standard for recognizing and
                implementing DNT signals has been finalized. As such, we
                do not currently respond to DNT browser signals or any
                other mechanism that automatically communicates your
                choice not to be tracked online. If a standard for
                online tracking is adopted that we must follow in the
                future, we will inform you about that practice in a
                revised version of this Privacy Notice.
                </p>
            </div>

            <!-- 10. DO OTHER REGIONS HAVE SPECIFIC PRIVACY RIGHTS? -->
            <div
                id="regional-privacy-rights"
                class="bg-gray-100 p-8 rounded-2xl shadow mb-10 scroll-mt-20"
            >
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                10. DO OTHER REGIONS HAVE SPECIFIC PRIVACY RIGHTS?
                </h2>

                <p class="text-gray-700 leading-relaxed mb-2">
                <strong>In Short:</strong> You may have additional
                rights based on the country you reside in.
                </p>

                <p class="text-gray-700 leading-relaxed mb-2">
                <strong>Philippines:</strong> We collect and process
                your personal information in accordance with the
                obligations and conditions set by the Data Privacy Act
                of 2012 (Republic Act No. 10173) and its implementing
                rules and regulations. This Privacy Notice satisfies the
                notice requirements defined in the Data Privacy Act.
                </p>

                <ul class="list-disc pl-6 text-gray-700 mb-4">
                <li>
                    Offer you the products or services that you want
                </li>
                <li>Respond to or help with your requests</li>
                <li>Manage your account with us</li>
                <li>Confirm your identity and protect your account</li>
                </ul>

                <p class="text-gray-700 leading-relaxed">
                You can request access or correction of your personal
                information by contacting us using the section
                <a
                    href="#review-update-delete"
                    class="text-blue-600 underline"
                    >"HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE
                    COLLECT FROM YOU?"</a
                >. If you believe we are unlawfully processing your
                personal information, you have the right to submit a
                complaint regarding a breach of the Data Privacy Act to
                the National Privacy Commission (NPC) of the
                Philippines.
                </p>
            </div>

            <!-- 11. DATA HANDLING OF UPLOADED QUESTIONNAIRES -->
            <div
                id="data-handling"
                class="bg-gray-100 p-8 rounded-2xl shadow mb-10 scroll-mt-20"
            >
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                11. DATA HANDLING OF UPLOADED QUESTIONNAIRES
                </h2>

                <p class="text-gray-700 leading-relaxed">
                All test questionnaires, questions, and answer files
                uploaded by teachers are securely stored in the TQRandom
                database (Supabase). This data is used only to generate
                randomized test versions and is not shared with
                unauthorized third parties. Uploaded files are encrypted
                and protected with access controls to prevent
                unauthorized access.
                </p>
            </div>

            <!-- 12. STUDENT ANONYMITY -->
            <div
                id="student-anonymity"
                class="bg-gray-100 p-8 rounded-2xl shadow mb-10 scroll-mt-20"
            >
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                12. STUDENT ANONYMITY
                </h2>

                <p class="text-gray-700 leading-relaxed">
                TQRandom does not collect or store any personally
                identifiable information of students. All student data
                remains anonymous, ensuring privacy and preventing
                tracking of individual student performance. Only the
                system-generated test responses are recorded for
                operational purposes, without linking them to personal
                identifiers.
                </p>
            </div>

            <!-- 13. LIMITATIONS ON THIRD-PARTY SHARING -->
            <div
                id="third-party-sharing"
                class="bg-gray-100 p-8 rounded-2xl shadow mb-10 scroll-mt-20"
            >
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                13. LIMITATIONS ON THIRD-PARTY SHARING
                </h2>

                <p class="text-gray-700 leading-relaxed">
                TQRandom will not sell, rent, or trade user information
                to advertisers or unrelated third parties. Personal and
                questionnaire data may only be shared with trusted
                service providers for system operations, maintenance, or
                legal compliance. All shared data is subject to strict
                confidentiality and security measures.
                </p>
            </div>

            <!-- 14. DO WE MAKE UPDATES TO THIS NOTICE? -->
            <div
                id="updates-notice"
                class="bg-gray-100 p-8 rounded-2xl shadow mb-10 scroll-mt-20"
            >
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                14. DO WE MAKE UPDATES TO THIS NOTICE?
                </h2>

                <p class="text-gray-700 leading-relaxed mb-2">
                <strong>In Short:</strong> Yes, we will update this
                notice as necessary to stay compliant with relevant
                laws.
                </p>

                <p class="text-gray-700 leading-relaxed">
                We may update this Privacy Notice from time to time. The
                updated version will be indicated by an updated
                "Revised" date at the top of this Privacy Notice. If we
                make material changes to this Privacy Notice, we may
                notify you either by prominently posting a notice of
                such changes or by directly sending you a notification.
                We encourage you to review this Privacy Notice
                frequently to be informed of how we are protecting your
                information.
                </p>
            </div>

            <!-- 15. HOW CAN YOU CONTACT US ABOUT THIS NOTICE? -->
            <div
                id="contact-about-notice"
                class="bg-gray-100 p-8 rounded-2xl shadow mb-10 scroll-mt-20"
            >
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                15. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?
                </h2>

                <p class="text-gray-700 leading-relaxed mb-2">
                If you have questions or comments about this notice, you
                may email us at
                <a
                    href="mailto:clarkboncales115@gmail.com"
                    class="text-blue-600 underline"
                    >clarkboncales115@gmail.com</a
                >,
                <a
                    href="mailto:joshuatubo4@gmail.com"
                    class="text-blue-600 underline"
                    >joshuatubo4@gmail.com</a
                >
                or contact us by post at:
                </p>

                <p class="text-gray-700 leading-relaxed">
                Ampayon<br />
                Butuan City, Agusan del Norte 8600<br />
                Philippines
                </p>
            </div>

            <!-- 16. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU? -->
            <div
                id="review-update-delete"
                class="bg-gray-100 p-8 rounded-2xl shadow mb-10 scroll-mt-20"
            >
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                16. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE
                COLLECT FROM YOU?
                </h2>

                <p class="text-gray-700 leading-relaxed mb-2">
                Based on the applicable laws of your country, you may
                have the right to request access to the personal
                information we collect from you, details about how we
                have processed it, correct inaccuracies, or delete your
                personal information. You may also have the right to
                withdraw your consent to our processing of your personal
                information. These rights may be limited in some
                circumstances by applicable law.
                </p>

                <p class="text-gray-700 leading-relaxed">
                To request to review, update, or delete your personal
                information, please visit:
                <a
                    href="https://tq-random.vercel.app"
                    class="text-blue-600 underline"
                    >tq-random.vercel.app</a
                >.
                </p>
            </div>
            </div>
        </section>
        <button
            @click="emit('close')"
            class="absolute font-bold top-3 right-4 text-white hover:text-gray-300"
        >
            ✕
        </button>
        </div>
    </div>
</template>
