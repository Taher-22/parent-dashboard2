import PageTransition from "../ui/PageTransition.jsx";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLang } from "../i18n/LangContext.jsx";

/* REAL 3D SUBJECTS */
import SubjectScene from "../three/subjects/SubjectScene.jsx";
import Astronomy from "../three/subjects/Astronomy.jsx";
import Math from "../three/subjects/Math.jsx";
import Reading from "../three/subjects/Reading.jsx";
import Science from "../three/subjects/Science.jsx";
import Minigames from "../three/subjects/Minigames.jsx";

/* ---------- DATA ---------- */
const subjects = [
  { id: "astronomy", nameKey: "subject_astronomy", component: <Astronomy /> },
  { id: "math",      nameKey: "subject_math",      component: <Math />      },
  { id: "reading",   nameKey: "subject_reading",   component: <Reading />   },
  { id: "science",   nameKey: "subject_science",   component: <Science />   },
  { id: "minigames", nameKey: "subject_minigames", component: <Minigames /> },
];

export default function Subjects() {
  const navigate = useNavigate();
  const { t } = useLang();

  // Map subject ids to translation keys so the cards render in the
  // current language. Falls back to the English literal in the data row.
  const NAME_KEYS = {
    math:      "nav_subjects",     // generic fallback; real name below
    astronomy: "subject_astronomy",
    reading:   "subject_reading",
    science:   "subject_science",
  };

  return (
    <PageTransition>
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {t("subjects_title")}
        </h1>
        <p className="opacity-75 mt-1">
          {t("subjects_subtitle")}
        </p>
      </div>

      {/* SUBJECT GRID — larger cards, thicker border, taller viewport so
          each subject reads as a substantial tile. Caps at 4 cols on xl
          (down from 5) so cards stay roomy on widescreens. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7 md:gap-8 mt-8">
        {subjects.map((s) => (
          <motion.div
            key={s.id}
            whileHover={{ y: -10, scale: 1.025 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/subjects/${s.id}`)}
            className="panel stroke rounded-[28px] p-6 md:p-7 cursor-pointer border-2 border-white/15 hover:border-white/25 transition-colors"
          >
            {/* 3D VIEWPORT — bigger square-ish canvas */}
            <div className="h-[300px] md:h-[340px] w-full">
              <SubjectScene enableControls={false}>
                {s.component}
              </SubjectScene>
            </div>

            {/* LABEL */}
            <div className="mt-5 text-center font-extrabold text-xl md:text-2xl tracking-tight">
              {t(s.nameKey)}
            </div>
          </motion.div>
        ))}
      </div>
    </PageTransition>
  );
}
