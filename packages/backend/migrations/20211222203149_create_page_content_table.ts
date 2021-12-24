import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const tableExists = await knex.schema.hasTable('page_content');

  if (!tableExists) {
    knex.schema.createTable('page_content', table => {
      table.increments('id');
      table.string('page').notNullable();
      table.text('content').notNullable();
    });
  }

  const existingData = [
    {
      page: '/about',
      content:
        'oare.byu.edu is an ongoing project with the aim to becoming a valuable research environment for Old Assyrian Studies. The database is inspired by the Online Cultural Heritage Research Environment (ochre.uchicago.edu) but is a simplified, SQL implementation of some of the concepts developed there, with some particular tools developed specifically for editing cuneiform texts and the extension of projects involved in articulating the syntactic relationships of words, phrases, clauses, etc. and by extension, the persons, assets, transactions, and events they recorded.\n\noare.byu.edu was organized and directed by Edward Stratford, Brigham Young University, but is the beneficiary of help from a great number of other individuals.\n\nRoughly half the published texts available on the website were first digitized by Karl Hecker and made available to the Old Assyrian Text project. Without his first efforts, this project would be far behind where it is now. Other members of the Old Assyrian Text Project also contributed to the accumulation of digitized forms of texts and deserve great thanks: Cecile Michele, Gojko Barjamovic, Guido Kryszat, Jan Gerrit Dercksen, Klaas Veenhof, Mogens Trolle Larsen, Thomas Hertel.\n\nA number of other specialists have kindly offered comments and feedback, including Bert Kouwenberg and Hakan Erol.\n\nJonathon Hanna (BYU student) converted the OCHRE export into SQL and helped shepherd the post-conversion cleanup and SQL implementation of the dataset. Brett Fisher (BYU student, graduated) setting up the JS project, the AWS hosting arrangement, integration of the SQL and the first major iteration of the site. Harrison Bludworth (BYU student) has overseen the project starting summer 2021, and implemented numerous improvements, including the import and edit modules.\n\nThanks also to Tyler Mortenson, Jooyeon Park, Justis Brown, Kyungwoo Jo, and Hongjoon Jun for the full stack development.\n\nA significant number of students from BYU participated in enhancing the textual data while in OCHRE: Alexa Blankenship, Allison Malmrose, Audrey Gabrielson, Brenton Erickson, Britta Johnson, Brittany Wallace, Catie Ashley, Chandler Helvey, Christina Nelson, Colton Kunz, Courtney Dotson, David Ferguson, David Ridge, David Romney, Emily Peterson, Emily Yankura, Jackie Davis, Jacob Murphy, Jake Inman, James Conway, Jason Saunders, Jeremy Madsen, Jeremy Schone, Jessica Dildine, Jessica Smith, Jessica Brown, JoLynne Minnick, Jonathon Nelson, Jordan Oseen, Kaili Sparks, Karlie Alldredge, Katherine Morse, Kayli Thomson, Kelsie Cannon, Lara Mayfield, Leonor Arnesen, Matilde Oreilly, Matthew Lin, McKenzi Christensen, Merna Raines, Michael Godfrey, Michael Trotter, Michaela Shurts, Natalie Merten, Nathan May, Nora Corcoran, Paul Gauthier, Ryan Winters, Sarah Rounsville, Stephanie Moffit, Stine Plomgren, Stuart Cooke, Thomas Richins, Trevor Murphy, Tyler Harris\n\nThank you to the following who prepared and imported texts into the OCHRE project: Andrew Dix, Annie Schloen, Jae-Hwan Kim.',
    },
    {
      page: '/',
      content:
        'Welcome to a pre-release of OARE (/’ôrə/) at oare.byu.edu.\n\nThis website aims to offer published Old Assyrian texts for viewing and eventually analysis.\n\nThe intended purpose of the database is to facilitate work with the Old Assyrian texts from the period of Kültepe Level II and Kültepe Level Ib. OARE is organized to record textual and expert observations arising from the interpretation, In this manner, it is intended to facilitate collaborative research projects on the historical and archaeological record of the Old Assyrian trade and society through linguistic, lexical, economic, social, and other lenses.\n\nThe core OARE database is part of the Online Cultural and Historical Research Environment (OCHRE, https://oi.uchicago.edu/research/ochre-data-service).\n\nAt present, only transliterations are available here. An initial onomasticon, lexicon, gazetteer, and temporal period index are in preparation for release. Asset and transaction indexes, a signlist and bibliography are also planned.\n\nThe sidebar search on the left prefers abbreviations used within the Old Assyrian specialist community (thus TC 2 instead of TCL 14) and only uses commas with reference to page numbers (thus TC 2 1 instead of TC 2, 1). Consult the (i) buttons there and in the Search page to find further search features.\n\nPlease be advised, we are still working out issues. Use transliterations at your own risk. Many texts display nicely, but some display errors occasionally occur. In addition, we are still auditing the data. Original transliterations of text published before roughly 2008 arise from the Old Assyrian Text Project and a few other sources. Transliterations from more recent publications were checked within OARE/OCHRE, but some errors were introduced in converting to the format used for this database.\n\nAt present, a traffic light symbol in front of the name of the text displays the current status of the transliteration. The vast majority are ‘yellow’ meaning the transliteration has not yet been checked. Hovering over the traffic light icon will indicate what the displayed colors mean for reliability of the transliteration.\n\nIf you are interested in participating in the project, please consider creating an account. Passwords chosen are not visible to us. We can share Beta features with interested registered users upon request and can make available further feedback mechanisms for development. Registered users can mark texts that are misbehaving, or point out errors. Anyone is invited to please send any feedback to oarefeedback@byu.edu.',
    },
  ];

  knex('page_content').insert(existingData);
}

export async function down(knex: Knex): Promise<void> {
  const tableExists = await knex.schema.hasTable('page_content');
  if (tableExists) {
    await knex.schema.dropTable('page_content');
  }
}
