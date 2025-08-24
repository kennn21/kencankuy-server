// src/google-places/google-places.controller.ts
import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { GooglePlacesService } from './google-places.service';
import { SearchByCategoryDto } from './dto/search-by-category.dto';

@Controller('google-places')
export class GooglePlacesController {
  constructor(private readonly googlePlacesService: GooglePlacesService) {}

  @Post('search-by-category')
  async searchAndStore(
    @Body(new ValidationPipe()) searchByCategoryDto: SearchByCategoryDto,
  ) {
    return this.googlePlacesService.findPlacesByCategory(
      searchByCategoryDto.category,
    );
  }
}
