import PageTransition from "../ui/PageTransition.jsx";
import { useParams } from "react-router-dom";
import Card from "../ui/Card.jsx";
import { useNavigate } from "react-router-dom";


export default function SubjectDetails() {
  const { subjectId } = useParams();
  const navigate = useNavigate();


  return (
    <PageTransition>
      <div>
        <h1 className="text-3xl font-extrabold capitalize">
          {subjectId} Overview
        </h1>
        <p className="opacity-75 mt-1">
          Detailed insights and learning patterns.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <Card title="Performance Summary">
          <p className="opacity-80 text-sm">
            Progress trends, engagement level, and strengths will appear here.
          </p>
        </Card>

        <Card title="Common Difficulties">
          <p className="opacity-80 text-sm">
            Detected weak points and suggested focus areas.
          </p>
        </Card>

        <Card title="Recent Sessions">
          <p className="opacity-80 text-sm">
            Game activity and outcomes.
          </p>
        </Card>

        <Card title="AI Insights">
  <p className="opacity-80 text-sm">
    Personalized recommendations based on learning behavior
    and engagement patterns.
  </p>

  <button
    onClick={() => navigate(`/ai?subject=${subjectId}`)}
    className="mt-4 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition"
  >
    Ask AI about {subjectId}
  </button>
</Card>
      </div>
    </PageTransition>
  );
}
