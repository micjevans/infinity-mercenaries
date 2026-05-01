import React from "react";
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

const ResourcesPage = () => {
  const resources = [
    { title: "Getting Started Guide", link: "https://example.com/start" },
    { title: "Game Rules", link: "https://example.com/rules" },
    { title: "Community Forum", link: "https://example.com/forum" },
  ];

  return (
    <Container maxWidth="md" style={{ marginTop: "20px" }}>
      <Typography variant="h4" gutterBottom>
        Resources
      </Typography>
      <List>
        {resources.map((resource, index) => (
          <ListItem
            key={index}
            button="true"
            component="a"
            href={resource.link}
            target="_blank"
          >
            <ListItemText primary={resource.title} />
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

export default ResourcesPage;
