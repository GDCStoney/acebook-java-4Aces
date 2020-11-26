import React from 'react';

const Post = (props) => {
	return (
		<div className='post-main'>
			<div className='post-content'>
			    <button type="button" className='post-buttons'>Del</button>
				{props.post.content}
				{props.post.id}
			</div>
		</div>
	)
}

export default Post;
