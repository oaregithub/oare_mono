import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  const tableExists = await knex.schema.hasTable('page_content');

  if (!tableExists) {
    await knex.schema.createTable('page_content', table => {
      table.increments('id');
      table.string('page').notNullable();
      table.text('content').notNullable();
    });
  }

  const existingData = [
    {
      page: '/about',
      content: `<p>
        oare.byu.edu is an ongoing project with the aim to becoming a valuable
        research environment for Old Assyrian Studies. The database is inspired
        by the Online Cultural Heritage Research Environment
        (ochre.uchicago.edu) but is a simplified, SQL implementation of some of
        the concepts developed there, with some particular tools developed
        specifically for editing cuneiform texts and the extension of projects
        involved in articulating the syntactic relationships of words, phrases,
        clauses, etc. and by extension, the persons, assets, transactions, and
        events they recorded.
      </p>

      <p>To read more here about the data structure of oare.</p>

      <p>
        oare.byu.edu was organized and directed by Edward Stratford, Brigham
        Young University, but is the beneficiary of help from a great number of
        other individuals.
      </p>

      <p>
        Roughly half the published texts available on the website were first
        digitized by Karl Hecker and made available to the Old Assyrian Text
        project. Without his first efforts, this project would be far behind
        where it is now. Other members of the Old Assyrian Text Project also
        contributed to the accumulation of digitized forms of texts and deserve
        great thanks: Cecile Michele, Gojko Barjamovic, Guido Kryszat, Jan
        Gerrit Dercksen, Klaas Veenhof, Mogens Trolle Larsen, Thomas Hertel.
      </p>

      <p>
        A number of other specialists have kindly offered comments and feedback,
        including Bert Kouwenberg and Hakan Erol.
      </p>

      <p>
        Jonathon Hanna (BYU student) converted the OCHRE export into SQL and
        helped shepherd the post-conversion cleanup and SQL implementation of
        the dataset. Brett Fisher (BYU student, graduated) setting up the JS
        project, the AWS hosting arrangement, integration of the SQL and the
        first major iteration of the site. Harrison Bludworth (BYU student) has
        overseen the project starting summer 2021, and implemented numerous
        improvements, including the import and edit modules.
      </p>

      <p>
        Thanks also to Tyler Mortenson, Jooyeon Park, Justis Brown, Kyungwoo Jo,
        and Hongjoon Jun for the full stack development.
      </p>

      <p>
        A significant number of students from BYU participated in enhancing the
        textual data while in OCHRE: Alexa Blankenship, Allison Malmrose, Audrey
        Gabrielson, Brenton Erickson, Britta Johnson, Brittany Wallace, Catie
        Ashley, Chandler Helvey, Christina Nelson, Colton Kunz, Courtney Dotson,
        David Ferguson, David Ridge, David Romney, Emily Peterson, Emily
        Yankura, Jackie Davis, Jacob Murphy, Jake Inman, James Conway, Jason
        Saunders, Jeremy Madsen, Jeremy Schone, Jessica Dildine, Jessica Smith,
        Jessica Brown, JoLynne Minnick, Jonathon Nelson, Jordan Oseen, Kaili
        Sparks, Karlie Alldredge, Katherine Morse, Kayli Thomson, Kelsie Cannon,
        Lara Mayfield, Leonor Arnesen, Matilde Oreilly, Matthew Lin, McKenzi
        Christensen, Merna Raines, Michael Godfrey, Michael Trotter, Michaela
        Shurts, Natalie Merten, Nathan May, Nora Corcoran, Paul Gauthier, Ryan
        Winters, Sarah Rounsville, Stephanie Moffit, Stine Plomgren, Stuart
        Cooke, Thomas Richins, Trevor Murphy, Tyler Harris
      </p>

      <p>
        Thank you to the following who prepared and imported texts into the
        OCHRE project: Andrew Dix, Annie Schloen, Jae-Hwan Kim.
      </p>`,
    },
    {
      page: '/',
      content: `<p>
          Welcome to a pre-release of OARE (/’ôrə/) at
          <a href="https://oare.byu.edu">oare.byu.edu</a>.
        </p>
        <p>
          This website aims to offer published Old Assyrian texts for viewing
          and eventually analysis.
        </p>
        <p>
          The intended purpose of the database is to facilitate work with the
          Old Assyrian texts from the period of Kültepe Level II and Kültepe
          Level Ib. OARE is organized to record textual and expert observations
          arising from the interpretation, In this manner, it is intended to
          facilitate collaborative research projects on the historical and
          archaeological record of the Old Assyrian trade and society through
          linguistic, lexical, economic, social, and other lenses.
        </p>
        <p>
          The core OARE database is part of the Online Cultural and Historical
          Research Environment (OCHRE,
          <a href="https://oi.uchicago.edu/research/ochre-data-service"
            >https://oi.uchicago.edu/research/ochre-data-service</a
          >).
        </p>
        <p>
          At present, only transliterations are available here. An initial
          onomasticon, lexicon, gazetteer, and temporal period index are in
          preparation for release. Asset and transaction indexes, a signlist and
          bibliography are also planned.
        </p>
        <p>
          The sidebar search on the left prefers abbreviations used within the
          Old Assyrian specialist community (thus TC 2 instead of TCL 14) and
          only uses commas with reference to page numbers (thus TC 2 1 instead
          of TC 2, 1). Consult the (i) buttons there and in the Search page to
          find further search features.
        </p>
        <p class="blue--text text--lighten-1">
          <em>
            Please be advised, we are still working out
            <router-link to="/issues">issues</router-link>. Use transliterations
            at your own risk. Many texts display nicely, but some display errors
            occasionally occur. In addition, we are still auditing the data.
            Original transliterations of text published before roughly 2008
            arise from the Old Assyrian Text Project and a few other sources.
            Transliterations from more recent publications were checked within
            OARE/OCHRE, but some errors were introduced in converting to the
            format used for this database.</em
          >
        </p>
        <p>
          At present, a traffic light symbol in front of the name of the text
          displays the current status of the transliteration. The vast majority
          are ‘yellow’ meaning the transliteration has not yet been checked.
          Hovering over the traffic light icon will indicate what the displayed
          colors mean for reliability of the transliteration.
        </p>
        <p>
          If you are interested in participating in the project, please consider
          creating an account. Passwords chosen are not visible to us. We can
          share Beta features with interested registered users upon request and
          can make available further feedback mechanisms for development.
          Registered users can mark texts that are misbehaving, or point out
          errors. Anyone is invited to please send any feedback to
          <a href="mailto:oarefeedback@byu.edu">oarefeedback@byu.edu</a>.
        </p>`,
    },
  ];

  await knex('page_content').insert(existingData);
}

export async function down(knex: Knex): Promise<void> {
  const tableExists = await knex.schema.hasTable('page_content');
  if (tableExists) {
    await knex.schema.dropTable('page_content');
  }
}
