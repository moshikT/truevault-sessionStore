exports.initIndexText = function (companyName, isDemo, isInEnglish, callback) {
    var addCandidateText = {
        //company : '',
        //personalInfoText = "Please fill your personal details";
        nameField : isInEnglish ? "Full Name" : "שם מלא",
        phoneField : isInEnglish ? "Phone Number" : "מספר טלפון",
        idField : isInEnglish ? "ID" : "ת.ז.",
        emailField : isInEnglish ? "Email" : "דואר אלקטרוני",
        recruitmentSourcelField : isInEnglish ? "Recruitment Source" : "מקור גיוס",
        textDirection : isInEnglish ? "ltr" : "rtl"
        //personalInfoText : isInEnglish ? "Please fill your personal details" : "להתחלת השאלון נא מלא/י את הפרטים הבאים:",
        //submitBtn : isInEnglish ? "Start Questionnaire" : "להתחלת השאלון",
        //next : isInEnglish ? "next" : "הבא",
        /*instructionText: isInEnglish ?
            (isDemo ? 'Demo Text in English' :
                (isCandidate) ? 'Candidate Text in English' : 'employee Text in English') :
            (isDemo ? 'לפניך שאלון לדוגמא/דמו למבחן מיון למועמדים לתפקיד נציגי שירות ו/או מכירה ב' + companyName + '.\n' +
                'יש להשיב על השאלון בכנות וברצינות ולמלא בסביבה נטולת הפרעות וברצף.\n' +
                'בתודה ובהערכה, צוות ההנהלה.' :
                (isCandidate ?
                    /* Hebrew text for candidates
                    'לפניך שאלון שמילויו אורך כחצי שעה.\n' +
                    'השאלון הנו מבחן מיון למועמדים לתפקיד נציגי שירות ו/או מכירה ב' + companyName + '.\n' +
                    //'יש להשיב בסביבה נטולת הפרעות וברצף.\n' +
                    //'פרט לשאלות שכותרתן \'שאלות חשיבה\', אין תשובות נכונות או לא נכונות בשאלון, עלייך לבחור בתשובה המשקפת בצורה הטובה ביותר את עמדתך/התנהגותך. \n' +
                    'השאלון יודע לאבחן דפוסי תשובה כנים יותר ופחות ולכן מומלץ להשיב בכנות ובפתיחות.\n' +
                    //'בשאלות החשיבה יש לסמן את התשובה הנכונה לדעתך, במידה ואינך בטוח/ה - יש לנחש.\n' +
                    'לא ניתן למלא את השאלון יותר מפעם אחת וכן לא ניתן להעבירו.\n' +
                    'חובה להשיב על כל השאלות בשאלון.\n' +
                    '\n' +
                    'אני מסכים לתנאי השימוש\n' +
                    'בהצלחה,\n' +
                    'צוות הגיוס' :
                    /* Hebrew text for employees
                    'לפניך שאלון שמילויו אורך כחצי שעה.\n' +
                    'השאלון הנו מבחן מיון למועמדים לתפקיד נציגי שירות ו/או מכירה ב' + companyName + '.\n' +
                    'הסיבה שאת/ה מתבקש/ת להשיב על השאלון היא על מנת שנוכל להבין כיצד העובדים הקיימים משיבים על השאלון.\n' +
                    'השאיפה שלנו היא לגייס עוד עובדים טובים כמוך!\n' +
                    'מטרה נוספת היא לקבל משוב מקדים על חוויית מילוי השאלון.\n' +
                    'חשוב מאוד לציין שלא נעשה בשאלון שום שימוש לטובת הערכה אישית שלך וכי נתוני השאלון שלך מעובדים באופן מוצפן על ידי חברה חיצונית.\n' +
                    'סומכים עלייך שתירתם למטרה של יצירת סביבת עבודה מצוינת ותשיב על השאלון בכנות וברצינות.\n' +
                    'את השאלון יש למלא בסביבה נטולת הפרעות וברצף.\n' +
                    'פרט לשאלות שכותרתן שאלות חשיבה, אין תשובות נכונות או לא נכונות בשאלון, עלייך לבחור בתשובה המשקפת בצורה הטובה ביותר את עמדתך/התנהגותך. השאלון יודע לאבחן דפוסי תשובה כנים יותר ופחות ולכן מומלץ להשיב בכנות ובפתיחות.\n' +
                    'בשאלות החשיבה יש לסמן את התשובה הנכונה לדעתך, במידה ואינך בטוח/ה - יש לנחש.\n' +
                    'לא ניתן למלא את השאלון יותר מפעם אחת וכן לא ניתן להעבירו.\n' +
                    'חובה למלא את כל השאלות בשאלון.\n' +
                    'בתודה ובהערכה, צוות ההנהלה.'))
    */
    }
        callback(addCandidateText);
};

exports.initFormPageText = function(isInEnglish, callback) {
    var pageText = {};
    pageText.submitText = isInEnglish ? "Submit" : "להגשת המבחן לחץ כאן";
    /*pageText.terms = {
        title : isInEnglish ? "Please confirm our Terms of service" : "* בבקשה אשר את תנאי השימוש",
        prefix : isInEnglish ? "I confirm our" : "אני מאשר את",
        postfix : isInEnglish ? " Terms of service" : " תנאי השימוש"
    }*/
    callback(pageText);
}