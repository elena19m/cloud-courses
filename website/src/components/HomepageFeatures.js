import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

const FeatureList = [
  {
    title: 'Cluster',
    Svg: require('../../static/img/cluster.drawio.svg').default,
    description: (
      <>
	A cluster infrastructure contains nodes from the same physical location.
      </>
    ),
  },
  {
    title: 'Grid',
    Svg: require('../../static/img/grid.drawio.svg').default,
    description: (
      <>
	A grid infrastructure contains nodes from different physical locations.
      </>
    ),
  },
  {
    title: 'Cloud',
    Svg: require('../../static/img/cloud.drawio.svg').default,
    description: (
      <>
	A cloud infrastructure abstracts the cluster and the grid and provides
	a unifor view of the resources that are allocated to the user.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} alt={title} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
