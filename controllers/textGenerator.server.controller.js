// Init language-dependent field names for candidate entry
exports.initCandidateFieldNames = function (lang, callback) {

    let addCandidateText;
    switch (lang) {
        case 'he':
            addCandidateText = {
                textAlign: 'right',
                textDir: 'rtl',
                title: 'הוסף מועמד',
                subTitle: 'הוסף מועמד עבור ',
                nameField: "שם מלא",
                phoneField: "מספר טלפון",
                idField: "ת.ז.",
                emailField: "דואר אלקטרוני",
                recruitmentSourcelField: "מקור גיוס",
                linkToCVField: "קישור לקו״ח",
                maleText: "זכר",
                femaleText: "נקבה",
                sendSMS: "שלח הודעת טקסט",
                notifyNewCandidate: "עדכון מועמד חדש",
                notifyNewCandidateReport: "עדכון דו״ח מועמד חדש"
            };
            callback(addCandidateText);
            break;
        case 'en':
        default:
            addCandidateText = {
                textAlign: 'left',
                textDir: 'ltr',
                title: 'Add Candidate',
                subTitle: 'Add candidate for',
                nameField: "Full Name",
                phoneField: "Phone Number",
                idField: "ID",
                emailField: "Email",
                recruitmentSourcelField: "Recruitment Source",
                linkToCVField: "Link to CV",
                textDirection: "ltr",
                maleText: "Male",
                femaleText: "Female",
                sendSMS: "Send SMS",
                notifyNewCandidate: "New Candidate Notification",
                notifyNewCandidateReport: "New Candidate Report Notification"
            };
            callback(addCandidateText);
            break;
    }

};

exports.initIndexPageText = function (lang, callback) {
    var pageText = {};
    switch (lang) {
        case 'he':
            pageText.textAlign = 'right';
            pageText.textDir = 'rtl';
            pageText.next = 'הבא';
            pageText.back = 'חזור';
            break;
        case 'en':
        default:
            pageText.textAlign = 'left';
            pageText.textDir = 'ltr';
            pageText.next = 'Next';
            pageText.back = 'Back';
            break;
    }
    callback(pageText);
};

exports.initFormPageText = function (lang, callback) {
    var pageText = {};
    switch (lang) {
        case 'he':
            pageText.submitText = "להגשת המבחן לחץ כאן";
            pageText.textAlign = 'right';
            pageText.textDir = 'rtl';
            break;
        case 'en':
        default:
            pageText.submitText = "Submit";
            pageText.textAlign = 'left';
            pageText.textDir = 'ltr';
            break;
    }
    callback(pageText);
};

exports.initThankYouText = function (lang, callback) {
    var pageText = {};
    switch (lang) {
        case 'he':
            pageText.textAlign = 'right';
            pageText.textDir = 'rtl';
            break;
        case 'en':
        default:
            pageText.textAlign = 'left';
            pageText.textDir = 'ltr';
            break;
    }
    callback(pageText);
};

exports.initRecruiterReportText = function (lang, callback) {
    let recruiterReportText;
    switch (lang) {
        case 'he':
            recruiterReportText = {
                title: 'דוח מועמד - ',
                textAlign: 'right',
                textDir: 'rtl',
                idField: "ת.ז: ",
                dateFormCompletedField: "מילוי השאלון: ",
                beforeXdaysField: "  (לפני X ימים)",
                phoneField: "טלפון: ",
                positionDescriptionField: "נציג/ת שירות ומכירות",
                recruiterSourceField: "מקור גיוס: ",
                CVField: "קורות חיים",
                formResultField: "ציון מבחן (לפני כיול):",
                lowField: "תחתונים",
                avgField: "מרכזיים",
                highField: "עליונים",
                dontRecommendField: "מומלץ לא להעסיק",
                furtherStepsField: "מומלץ להמשיך בתהליך המיון ולברר התאמה",
                RecommendField: "מומלץ להעסיק",
                issuesToTestField: "נקודות לבירור",
                expectedBehaviorField: 'המועמד\n' + '<b>סביר</b> להציג את ההתנהגויות\n' + '<br>או הנטיות הבאות:',
                inATeamField: "בצוות ובארגון-\n",
                strengthsField: "נקודות עוצמה"
            };
            break;
        case 'en':
        default:
            recruiterReportText = {
                title: 'Candidate Report - ',
                textAlign: 'left',
                textDir: 'ltr',
                idField: "ID: ",
                dateFormCompletedField: "Test Date: ",
                beforeXdaysField: "(X days ago)",
                phoneField: "Phone: ",
                positionDescriptionField: "Sales Representative",
                recruiterSourceField: "Recruiting Sources: ",
                CVField: "CV",
                formResultField: "Test results (before calibration):",
                lowField: "Low",
                avgField: "Average",
                highField: "Top",
                dontRecommendField: "Do not hire",
                furtherStepsField: "Requires further assessment",
                RecommendField: "Hire",
                issuesToTestField: "Points for Inquiry",
                expectedBehaviorField: 'The candidate is <b>likely</b> to display the following<br> behaviors or tendencies: ',
                inATeamField: "In a team-",
                strengthsField: "Main Strengths"
            };
            break;
    }
    callback(pageText);
};
