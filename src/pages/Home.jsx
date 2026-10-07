import Header from "../components/Header";
import { Link } from "react-router-dom";
import "./Home.css";

const Home = () => {
  return (
    <main className="home">
      <Header />
      <div className="title__container">
        <span className="title__chevrons title__chevrons-left" aria-hidden="true" />
        <span className="title__chevrons title__chevrons-right" aria-hidden="true" />
        <Link className="subtititle__choice subtititle__choice-left" to="/intro">
          <span className="subtitle__button" aria-hidden="true" />
          <span className="subtitle">DISCOVER A.I.</span>
        </Link>
        <h1 className="title">Sophisticated skincare</h1>
        <Link className="subtititle__choice subtititle__choice-right" to="/intro">
          <span className="subtitle">TAKE TEST</span>
          <span className="subtitle__button" aria-hidden="true" />
        </Link>
        <div className="button__instructions-wrapper">
          <span className="button__image" aria-hidden="true">
            <span />
          </span>
          <p className="button__instructions">
            TAP AND HOLD
            <br />
            TO PROCEED TO SECTION
          </p>
        </div>
      </div>
      <p className="home__pg">
        SKINSTRIC DEVELOPED AN A.I. THAT CREATES
        <br />
        A HIGHLY-PERSONALIZED ROUTINE TAILORED TO
        <br />
        WHAT YOUR SKIN NEEDS.
      </p>
    </main>
  );
};

export default Home;