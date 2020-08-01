document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => {
    // load_mailbox('inbox')
    load_mails('inbox')
  });

  document.querySelector('#sent').addEventListener('click', () => {
    // load_mailbox('sent')
    load_mails('sent')
  });

  document.querySelector('#archived').addEventListener('click', () => {
    // load_mailbox('archive')
    load_mails('archive')
  });

  document.querySelector('#compose').addEventListener('click', compose_email);


  // By default, load the inbox
  load_mails('inbox');

  document.querySelector('#compose-form').onsubmit = function() {
    const email_recipients = document.querySelector('#compose-recipients').value
    const email_subject = document.querySelector('#compose-subject').value
    const email_body = document.querySelector('#compose-body').value

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: email_recipients,
          subject: email_subject,
          body: email_body
      })
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);
        load_mailbox('sent');
        load_mails('sent');
        document.querySelector('#status').style.display = 'block';
        if(result['error']){
          document.querySelector('#status').innerHTML = "Error encountered: " + result['error'];
        }
        else{
          document.querySelector('#status').innerHTML = result['message'];
        }
    });
    //Don't submit form
    return false;
  }
}); //end DOMContentLoaded

function load_mails(mailbox){
  var newmessages = 0; //count unread messages
  var sentmessages = 0;//count sent messages
  var archivedmessages = 0; //count archived messages
  console.log(mailbox);
  load_mailbox(mailbox)
  fetch('/emails/'+mailbox)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails)
      const app = document.getElementById('emails-view');
      var i = 0;
      var sendertext = '';
      emails.forEach((val) => {
      const element = document.createElement('div');
      element.classList.add("emails");

      if (emails[i]['read']){
        sendertext = "From: " + emails[i]['sender'];
        element.classList.add("emails-read");
      }
      else {
        console.log(emails[i]['read']);
        sendertext = "<b>From: " + emails[i]['sender'] + "</b>";
        element.classList.add("emails");
        newmessages++;
        console.log(newmessages);
      }

      p2 = document.createElement('p');
      p2.classList.add("alignright");
      p2.innerHTML = emails[i]['timestamp'];

      p2.classList.add("alignright");
      element.appendChild(p2);
      if(mailbox == "inbox"){
        element.innerHTML += sendertext;
        element.innerHTML += " <br>Subject :" + emails[i]['subject'];
        document.querySelector('#archive-div').style.display = 'block';
        document.querySelector('#reply-div').style.display = 'block';

      }
      else if(mailbox == "sent"){
        element.innerHTML += "<b>To: " + emails[i]['recipients'] + "</b>";
        element.innerHTML += " <br>Subject :" + emails[i]['subject'];
        document.querySelector('#archive-div').style.display = 'none';
        document.querySelector('#reply-div').style.display = 'none';
        sentmessages++;
      }
      else if(mailbox == "archive"){
        element.innerHTML += "<b> From: " + emails[i]['sender'] + "</b>";
        element.innerHTML += " <br>Subject :" + emails[i]['subject'];
        document.querySelector('#archive-div').style.display = 'block';
        document.querySelector('#archive-btn').innerHTML = 'Move to Inbox';
        document.querySelector('#reply-div').style.display = 'none';
        archivedmessages++;
      }
      var em_id = emails[i]['id'];
      //When the email is click, view the email details
      element.addEventListener('click', () => {
        fetch('/emails/'+em_id)
        .then(response => response.json())
        .then(email => {
            // Print email
            document.querySelector('#emails-view').style.display = 'none';
            document.querySelector('#compose-view').style.display = 'none';
            document.querySelector('#email-details').style.display = 'block';
            document.querySelector('#messages').style.display = 'none';

            if(mailbox == "inbox"){
            document.querySelector('#email-head').innerHTML = "<h3>" + email['subject'] + "</h3>" + "From: " + email['sender'] + "<br>" + email['timestamp'] + "<hr>";
            }
            else if(mailbox == "sent"){
              document.querySelector('#email-head').innerHTML = "<h3>" + email['subject'] + "</h3>" + "To: " + email['sender'] + "<br>" + email['timestamp']+ "<hr>";
            }
            else if(mailbox == "archive"){
              document.querySelector('#email-head').innerHTML = "<h3>" + email['subject'] + "</h3>" + "From: " + email['sender'] + "<br>" + email['timestamp']+ "<hr>";
            }
            document.querySelector('#email-body').innerHTML = email['body'] ;
            document.querySelector('#emails-view').append(element[i]);

            //event listener for archive button
            if (email['archived']){
              document.querySelector('#archive-btn').value = "Unarchive Mail";
              document.querySelector('#archive-btn').onclick = function() {
                console.log(email['archived']);
                   fetch('/emails/'+em_id, {
                     method: 'PUT',
                     body: JSON.stringify({
                         archived: false
                     })
                   })
                   // load_mailbox('inbox');
                   load_mails('inbox');
              }
            }
            else {
              document.querySelector('#archive-btn').onclick = function() {
                console.log(email['archived']);
                   fetch('/emails/'+em_id, {
                     method: 'PUT',
                     body: JSON.stringify({
                         archived: true
                     })
                   })
                   // load_mailbox('inbox');
                   load_mails('inbox');
                 }
              }
            //Reply mail
            document.querySelector('#reply-btn').addEventListener('click', () => {
              reply_email(em_id)
            });


            //Update the email to read status
            fetch('/emails/'+em_id, {
              method: 'PUT',
              body: JSON.stringify({
                  read: true
              })
            })
        });
      }); //end of addEventListener for element div
      app.appendChild(element);
      i++;
    }); //end of foreach loop
    if(mailbox == "inbox"){
      document.querySelector('#messages').style.display = 'block';
      document.querySelector('#messages').innerHTML = "New message(s)( "+ newmessages + " ) of " + emails.length + " messages.";
    }
    else if(mailbox == "sent"){
      document.querySelector('#messages').style.display = 'block';
      document.querySelector('#messages').innerHTML = "Sent messages( " + sentmessages + " )";
    }
    else if(mailbox == "archive"){
      document.querySelector('#messages').style.display = 'block';
      document.querySelector('#messages').innerHTML = "Archived messages( "+ archivedmessages + " )";
    }
  });
} //end of function load mails
function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-details').style.display = 'none';
  document.querySelector('#messages').style.display = 'none';
  document.querySelector('#form-email-heading').innerHTML = 'New Email';
  document.querySelector('#status').style.display = 'none';
  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function reply_email(em_id) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-details').style.display = 'none';
  document.querySelector('#form-email-heading').innerHTML = 'Reply';


  // Clear out composition fields

  fetch('/emails/'+em_id)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);
      // ... do something else with email ...
      document.querySelector('#compose-recipients').value = email['sender'];
      document.querySelector('#compose-subject').value = "Re: " + email['subject'];
      document.querySelector('#compose-body').value = "On " +  email['timestamp'] + " " + email['sender'] + " wrote:";
      document.querySelector('#compose-body').value +=  email['body'];
  });

}


function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-details').style.display = 'none';
  document.querySelector('#status').style.display = 'none';
  document.querySelector('#messages').style.display = 'none';
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
}
