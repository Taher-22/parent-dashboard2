import PageTransition from "../ui/PageTransition.jsx";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

/* REAL 3D SUBJECTS */
import SubjectScene from "../three/subjects/SubjectScene.jsx";
import Astronomy from "../three/subjects/Astronomy.jsx";
import Math from "../three/subjects/Math.jsx";
import Reading from "../three/subjects/Reading.jsx";
import Science from "../three/subjects/Science.jsx";

/* ---------- DATA ---------- */
const subjects = [
  {
    id: "astronomy",
    name: "Astronomy",
    component: <Astronomy />,
  },
  {
    id: "math",
    name: "Math",
    component: <Math />,
  },
  {
    id: "reading",
    name: "Reading",
    component: <Reading />,
  },
  {
    id: "science",
    name: "Science",
    component: <Science />,
  },
];

export default function Subjects() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Subjects
        </h1>
        <p className="opacity-75 mt-1">
          Learning areas represented with interactive 3D objects.
        </p>
      </div>

      {/* SUBJECT GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mt-6">
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
              {s.name}
            </div>
          </motion.div>
        ))}
      </div>
    </PageTransition>
  );
}
