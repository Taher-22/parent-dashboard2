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

      {/* SUBJECT GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mt-6">
        {subjects.map((s) => (
          <motion.div
            key={s.id}
            whileHover={{ y: -10, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/subjects/${s.id}`)}
            className="panel stroke rounded-3xl p-4 cursor-pointer"
          >
            {/* 3D VIEWPORT */}
            <div className="h-[220px] w-full">
              <SubjectScene enableControls={false}>
                {s.component}
              </SubjectScene>
            </div>

            {/* LABEL */}
            <div className="mt-3 text-center font-semibold text-lg">
              {t(s.nameKey)}
            </div>
          </motion.div>
        ))}
      </div>
    </PageTransition>
  );
}
