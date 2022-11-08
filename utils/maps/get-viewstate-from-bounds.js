import {WebMercatorViewport} from '@deck.gl/core';

export default function getViewStateFromBounds(bounds, w, h){
	const vp = new WebMercatorViewport({width: w, height: h});
	const {longitude, latitude, zoom} = vp.fitBounds(
		[[bounds[0], bounds[1]],[bounds[2], bounds[3]]],
		{padding: Math.max(w, h) * 0.12});
	return {longitude, latitude, zoom};
}