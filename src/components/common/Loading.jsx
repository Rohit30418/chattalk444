import React, { memo } from 'react';
import GradientSpinner from './GradientSpinner';

const Loading = memo(() => <GradientSpinner />);

Loading.displayName = 'Loading';

export default Loading;
