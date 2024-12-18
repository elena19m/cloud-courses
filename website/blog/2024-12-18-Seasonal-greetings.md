---
title: Ho, ho, ho! Seasonal (spam) greetings!
description: Ho, ho, ho! Seasonal (spam) greetings!
slug: seasonal-spam
tags: [SOCcare, security, threat intelligence sharing]

hide_table_of_contents: false
---

import SOCcareLogo from './assets/soccare.png';
import gif from './assets/gekko-cantrefuse.gif';

The Christmas season brings, besides joy and lights, warm emails with a twist.
Good samaritans who want to share their joy and money with you will send you an
email with an incredible offer that cannot be refused.

<img src={gif} width="600"/>

If you are enticed by their offer, you can send them your personal information
in return (name, bank information and so on).

<!-- truncate -->

Beware! If something sounds too good to be true, it usually is a scam.
As presented in this blog post from [Bitdefender](https://www.bitdefender.com/en-us/blog/hotforsecurity/seasonal-themed-scams-hit-user-inboxes-in-the-run-up-to-christmas-bitdefender-antispam-lab-warns),
spam campaigns tend to multiply like mushrooms during December.

Some of them might seem innocent (you just have to reply, nothing more, see below),
but, in reality, your response/action shows the attackers that your email is still
active and they can continue phishing for information. Others may directly request
bank data (check the second spam sample) or, even worse, send you malicious files.


See below such spam message received by one of our colleagues:

```
 From: ANNA LESZCYNSKA <annaleszcynska86@gmail.com>
Date: Tue, 17 Dec 2024 at 15:56
Subject: Thank God
To:

 Donation From Mrs Anna Leszcynska.

Dearest one,

 Complement of the season to you & family know that this letter may come to you as a surprise, I believe that you will be honest and sincere to fulfill my final wish before I die. I am presently in Abidjan, Ivory Coast, West-Africa .Since eight years ago as a business woman dealing with cocoa exportation; I am Anna Leszczynska malgorzata 54 years old now suffering from a long time colon cancer. From all indications, my condition is really deteriorating, and my doctors have courageously advised me that I may not live beyond the next One Month, this is because the cancer stage has reached a critical stage. I have no children. My husband died in a fatal motor accident some years back, since his death I decided not to re- marry because of my bad health.


 Before The death of my husband, he deposited the sum of four million four hundred thousand dollars in the bank, I want you to assist me in order to claim the fund from the bank, the sum of Four Million Four Hundred Thousand United States Dollars as my husband's foreign business partner, after you have received the Fund to your account in your country, you will then use it for humanitarian project. Keep 30% of the money for yourself for your help to my wish and invest the rest of the money in humanitarian projects. I believe you are in a better position to help me claim the Fund from the Bank, As soon as I receive your reply I shall give you the contact of the Bank where the Fund is deposited.

 Please assure me that you will act accordingly as I stated here. If you are interested kindly reply immediately and always remember me in your daily prayers thanks and remain blessed.

Regards Anna.

```

How to easily identify spam messages:
  - check the source and the destination.
You can see that the "To: " section is empty. Our colleague's email address was
added as BCC. Most of the time, this implies that a mass email was sent and recipients
shouldn’t know about each other.
  - double-check if you know that person. One fast Google search for this person's
name (Anna Leszczynska malgorzata) shows multiple links to posts regarding scam
activities under this name.
  - very sad and emotional story, usually implying an illness or death of someone,
trying to pull on your heart strings. In this case, the sender is supposed to die
in a very short time (so you have to respond ASAP and not lose the opportunity).
  - the large amount of money this good samaritan wants to donate to you (Why you?
Who knows? They must have found your CV somewhere and you impressed them so so much).

[Here](https://blog.google/technology/safety-security/how-to-spot-scams-and-what-to-do-if-you-encounter-one/#spotwebscamshttps://blog.google/technology/safety-security/how-to-spot-scams-and-what-to-do-if-you-encounter-one/#spotwebscams) you have a very comprehensive blog post on how you can spot scams and keep your digital data secure. Other interesting (and recent) articles on this topic can be found here:
  - https://blog.google/products/gmail/gmail-holidays-2024-spam-scam/
  - https://thehackernews.com/2024/12/ongoing-phishing-and-malware-campaigns.html
  - https://news.trendmicro.com/2024/12/17/christmas-scams-2024/

Another spam sample received by our colleagues can be found below. This time,
the “To” field is filled with a mail address (usually to bypass the spam filters).
Here, the sender implies that you had a previous discussion (over the phone) and
this is just a follow-up message. In order to complete the “financial transfer”,
you have to generously send them a lot of your personal information (which can
then be used for other fraudulent activities). The “RE: REF …” at the beginning of
the subject is there to trick you: you might think the message is a reply to a
previous conversation. Moreover, there seems to be a payment reference which makes
things look more credible.


```
From: M a u r i c e <brickshire00-005@cepimose.si>
Date: Wed, 11 Dec 2024 at 05:36
Subject: A T T N: Beneficiary
To: <brickshire00-005@cepimose.si>


ATTN: Beneficiary

RE: REF: PAY/APRD-783/0945/NO

Dear Customer,

Following all our fruitless efforts to reach you on the phone as regards to the payment order received in your favor, this is to officially notify you that your payment, with its full interest, is now 100% approved for final transfer, and this fund release instruction will be carried out swiftly upon your good compliance. So therefore you are requested to kindly re-confirm to us as listed below so we can commence with immediate release of your fund as instructed via Bank to Bank wire Transfer respectively. To enable us commence with the procedures for a smooth completion of transaction, you are requested to attach a copy of your valid means of identification, also furnish us with the below personal and banking details.

RE-CONFIRM AS LISTED BELOW:

BENEFICIARY'S FULL NAME:
BENEFICIARY'S CONTACT ADDRESS:
BENEFICIARY'S ACTIVE TEL NUMBER:
BENEFICIARY'S MOBILE NUMBER:

BENEFICIARY'S BANK NAME:
BENEFICIARY'S BANK ADDRESS:
BANK SWIFT CODE:
BANK ROUTING NUMBER:
BANK IBAN NUMBER:
BANK ACCOUNT NUMBER:
BENEFICIARY'S ACCOUNT NAME:

Looking forward to your swift response to enable us to serve you better.

Yours Truly,

MR, Maurice Donald
Head of Operations, Santander Bank UK plc
London, NW1 3AN, United Kingdom.

```

[Here](https://www.santander.co.uk/personal/support/fraud-and-security/spotting-fraud-or-scams) is yet another comprehensive article on how to spot scams, by the company this scammer impersonated.

So, keep in mind: if something sounds too good to be true, it probably is a scam.
Keep a sharp eye, stay safe and don’t read your (spam) emails during the Christmas
holidays (you should probably spend that time with your loved ones).


### SOCcare

The SOCcare project is co-funded by the European Union, alongside our collaborators,
NRD Cyber Security and RevelSI, and supported by the
European Cybersecurity Competence Centre (ECCC) Centre (ECCC) under Grant Agreement No. 101145843.
Views and opinions expressed are however those of the author(s) only and do not necessarily
reflect those of the European Union or the European Cybersecurity Competence Centre.
Neither the European Union nor the European Cybersecurity Competence Centre can be held responsible for them.

<img src={SOCcareLogo} width="600"/>
