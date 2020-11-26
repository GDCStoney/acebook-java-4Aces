import React from 'react';
import Posts from './posts'
const client = require('../client');

const follow = require('../follow');

class PostsBuilder extends React.Component {
  constructor(props) {
    super(props)
    this.state = {posts: []};
  }

  loadFromServer(pageSize) {
    follow(client, root, [
        {rel: 'posts', params: {size: pageSize}}]
    ).then(postCollection => {
        return client({
            method: 'GET',
            path: postCollection.entity._links.profile.href,
            headers: {'Accept': 'application/schema+json'}
        }).then(schema => {
            this.schema = schema.entity;
            return postCollection;
        });
    }).done(postCollection => {
        this.setState({
            posts: postCollection.entity._embedded.posts,
            attributes: Object.keys(this.schema.properties),
            pageSize: pageSize,
            links: postCollection.entity._links
        });
    });
  }

  componentDidMount() {
    this.loadFromServer(this.state.pageSize);
    // client({method: 'GET', path: '/api/posts'}).then(response => {
    //  this.setState({posts: response.entity._embedded.posts});
    // });
  }

	render() {
		return (
      <Posts posts={this.state.posts}/>
		)
	}
}

export default PostsBuilder;
