import React from 'react';

const Post = (props) => {
	return (
		<div className='post-main'>
			<div className='post-content'>
				{props.post.id}
			</div>
		</div>
	)
}

export default Post;
