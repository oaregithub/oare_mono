<template>
  <OareContentView>
    <v-row justify="center" class="title font-weight-regular">
      <v-col cols="12" lg="10">
        <p>
          Welcome to a pre-release of OARE Jooyeon!!!!!! (/’ôrə/) at
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
          arising from the interpretation, In this manner, it is intended
          to facilitate collaborative research projects on the
          historical and archaeological record of the Old Assyrian trade and
          society through linguistic, lexical, economic, social, and other
          lenses.
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
            OARE/OCHRE, but some errors were introduced in converting to
            the format used for this database.</em
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
          creating an account. Passwords chosen are not visible to us. We can share
          Beta features with interested registered users and can make available 
          further feedback mechanisms for development. Registered users can mark
          texts that are misbehaving, or point out errors. Anyone is invited to 
          please send any feedback to
          <a href="mailto:oarefeedback@byu.edu">oarefeedback@byu.edu</a>.
        </p>
      </v-col>
    </v-row>
  </OareContentView>
</template>
