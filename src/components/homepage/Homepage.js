import './Homepage.css';

const Homepage = () => {
  return (
    <section className="homepage-section">
      <img className="homepage-coin" src={`${process.env.PUBLIC_URL}/logo192.png`} alt="Muebles" />
    </section>
  );
};

export default Homepage;
