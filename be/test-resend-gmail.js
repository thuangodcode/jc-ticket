const { Resend } = require('resend');

const resend = new Resend('re_BKCLC9ho_A8Ubih81YihJRgmj8FTVP5q5');

resend.emails.send({
  from: 'JC-Ticket <120304thuan@gmail.com>',
  to: '120304thuan@gmail.com',
  subject: 'Test Domain Limit',
  html: '<p>Test</p>'
})
.then(response => {
  console.log('Success:', response);
})
.catch(error => {
  console.error('Error:', error);
});
