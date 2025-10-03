import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Landing.css'

export default function Landing() {
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="landing">
      <header className="landingNav">
        <div className="navInner">
          <div className="brand">City Bus Tracking</div>
          <nav className="links">
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
            <button className="navCta" onClick={() => navigate('/user')}>Get started</button>
          </nav>
        </div>
      </header>
      <section className="landingHero">
        <div className="heroGrid">
          <div className="heroCol">
            <h1 className="landingTitle">City Bus Tracking</h1>
            <p className="landingSubtitle">
              Live locations, accurate ETAs, and stop-wise timetables—all in one place. Plan your journey with confidence and reach on time.
            </p>
            <div className="heroCtas">
              <button className="ctaButton ctaPrimary" onClick={() => navigate('/user')}>Get started</button>
              <a className="ctaLink" href="#about">Learn more</a>
            </div>
            <div className="heroMeta">
              <span>Real-time routing</span>
              <span>Multi-language</span>
              <span>Responsive UI</span>
            </div>
          </div>
          {null}
        </div>
        <div className="blob blob1" />
        <div className="blob blob2" />
      </section>
      <div className="landingBody">
        <section className="features">
          <div className="featureCard">
            <div className="featureTitle">Real-time Tracking</div>
            <div className="featureText">See buses on the map with updated locations and route highlights.</div>
          </div>
          <div className="featureCard">
            <div className="featureTitle">Accurate ETA</div>
            <div className="featureText">ETAs computed using road distance via OSRM, not just straight lines.</div>
          </div>
          <div className="featureCard">
            <div className="featureTitle">Timetables & Multilingual</div>
            <div className="featureText">Check stop-wise schedules and switch between English, Hindi, Marathi.</div>
          </div>
        </section>
        <section className="infoGrid" id="about">
          <div className="infoCard">
            <h3>About</h3>
            <p className="landingParagraph">This app helps commuters make smarter travel decisions. Enable location to locate the closest bus stops, then choose any stop to see upcoming buses, live ETA calculations using road-routing, and a clean timetable. Built with performance and accessibility in mind.</p>
          </div>
          <div className="infoCard" id="contact">
            <h3>Contact us</h3>
            <p className="landingParagraph">Have feedback or partnership ideas? Reach out at <a className="link" href="mailto:support@citybus.local">support@citybus.local</a>.</p>
          </div>
        </section>
      </div>
      <footer className="footer">
        <div className="footerInner">
          <div className="quickTitle">Quick links</div>
          <div className="quickLinks">
            <a href="/">Home</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
            <a onClick={() => navigate('/user')}>User Panel</a>
          </div>
        </div>
      </footer>
    </div>
  )
}


