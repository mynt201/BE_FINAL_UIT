const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const { authenticate, authorize } = auth;
const floodRiskAssessmentService = require('../services/external-apis/floodRiskAssessmentService');
const weatherService = require('../services/external-apis/weatherService');
const elevationService = require('../services/external-apis/elevationService');
const openStreetMapService = require('../services/external-apis/openStreetMapService');
const vietnamGovService = require('../services/external-apis/vietnamGovService');
const { logger } = require('../utils/logger');

const router = express.Router();

// Rate limiting for external API calls (more restrictive)
const externalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: {
    success: false,
    message: 'Too many external API requests, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all external API routes
router.use(externalApiLimiter);

// Apply authentication to all routes
router.use(authenticate);

// =====================================
// FLOOD RISK ASSESSMENT ROUTES
// =====================================

/**
 * @route POST /api/v1/external/flood-risk/assess
 * @desc Comprehensive flood risk assessment for a location
 * @access Private
 */
router.post('/flood-risk/assess',
  [
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
    body('name').optional().isString().trim(),
    body('province').optional().isString().trim(),
    body('district').optional().isString().trim(),
    body('ward').optional().isString().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { latitude, longitude, name, province, district, ward } = req.body;

      const location = { latitude, longitude, name, province, district, ward };
      const assessment = await floodRiskAssessmentService.assessFloodRisk(location);

      if (!assessment) {
        return res.status(500).json({
          success: false,
          message: 'Unable to complete flood risk assessment'
        });
      }

      res.json({
        success: true,
        data: assessment
      });

    } catch (error: any) {
      logger.error('Error in flood risk assessment route:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during flood risk assessment'
      });
    }
  }
);

/**
 * @route POST /api/v1/external/flood-risk/batch-assess
 * @desc Batch flood risk assessment for multiple locations
 * @access Private (Admin only)
 */
router.post('/flood-risk/batch-assess',
  authorize(['admin']),
  [
    body('locations').isArray({ min: 1, max: 20 }).withMessage('1-20 locations required'),
    body('locations.*.latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
    body('locations.*.longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
    body('locations.*.name').optional().isString().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { locations } = req.body;
      const assessments = await floodRiskAssessmentService.batchAssessFloodRisk(locations);

      res.json({
        success: true,
        data: assessments,
        summary: {
          total_requested: locations.length,
          total_assessed: assessments.length,
          success_rate: Math.round((assessments.length / locations.length) * 100)
        }
      });

    } catch (error: any) {
      logger.error('Error in batch flood risk assessment route:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during batch assessment'
      });
    }
  }
);

/**
 * @route GET /api/v1/external/flood-risk/alerts/:province
 * @desc Get flood alerts for a province
 * @access Private
 */
router.get('/flood-risk/alerts/:province',
  [
    param('province').isString().trim().notEmpty().withMessage('Province name required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { province } = req.params;
      const alerts = await floodRiskAssessmentService.getFloodAlerts(decodeURIComponent(province || ''));

      res.json({
        success: true,
        data: alerts
      });

    } catch (error: any) {
      logger.error('Error in flood alerts route:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error getting flood alerts'
      });
    }
  }
);

/**
 * @route GET /api/v1/external/flood-risk/regional-summary/:province
 * @desc Get regional flood risk summary
 * @access Private
 */
router.get('/flood-risk/regional-summary/:province',
  [
    param('province').isString().trim().notEmpty().withMessage('Province name required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { province } = req.params;
      const summary = await floodRiskAssessmentService.getRegionalRiskSummary(decodeURIComponent(province || ''));

      if (!summary) {
        return res.status(404).json({
          success: false,
          message: 'Regional summary not available'
        });
      }

      res.json({
        success: true,
        data: summary
      });

    } catch (error: any) {
      logger.error('Error in regional summary route:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error getting regional summary'
      });
    }
  }
);

// =====================================
// WEATHER API ROUTES
// =====================================

/**
 * @route GET /api/v1/external/weather/current
 * @desc Get current weather for a location
 * @access Private
 */
router.get('/weather/current',
  [
    query('location').isString().trim().notEmpty().withMessage('Location required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { location } = req.query;
      const weather = await weatherService.getCurrentWeather(location as string);

      if (!weather) {
        return res.status(404).json({
          success: false,
          message: 'Weather data not available for this location'
        });
      }

      res.json({
        success: true,
        data: weather
      });

    } catch (error: any) {
      logger.error('Error in current weather route:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error getting weather data'
      });
    }
  }
);

/**
 * @route GET /api/v1/external/weather/forecast
 * @desc Get weather forecast for a location
 * @access Private
 */
router.get('/weather/forecast',
  [
    query('location').isString().trim().notEmpty().withMessage('Location required'),
    query('days').optional().isInt({ min: 1, max: 10 }).withMessage('Days must be 1-10'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { location, days = 7 } = req.query;
      const forecast = await weatherService.getWeatherForecast(location as string, parseInt(days as string));

      if (!forecast) {
        return res.status(404).json({
          success: false,
          message: 'Forecast data not available for this location'
        });
      }

      res.json({
        success: true,
        data: forecast
      });

    } catch (error: any) {
      logger.error('Error in weather forecast route:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error getting forecast data'
      });
    }
  }
);

// =====================================
// ELEVATION API ROUTES
// =====================================

/**
 * @route GET /api/v1/external/elevation
 * @desc Get elevation for coordinates
 * @access Private
 */
router.get('/elevation',
  [
    query('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
    query('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { lat, lng } = req.query;
      const elevation = await elevationService.getElevation(parseFloat(lat as string), parseFloat(lng as string));

      if (elevation === null) {
        return res.status(404).json({
          success: false,
          message: 'Elevation data not available for these coordinates'
        });
      }

      res.json({
        success: true,
        data: {
          latitude: parseFloat(lat as string),
          longitude: parseFloat(lng as string),
          elevation
        }
      });

    } catch (error: any) {
      logger.error('Error in elevation route:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error getting elevation data'
      });
    }
  }
);

/**
 * @route GET /api/v1/external/elevation/flood-risk
 * @desc Get flood risk factors based on elevation and terrain
 * @access Private
 */
router.get('/elevation/flood-risk',
  [
    query('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
    query('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { lat, lng } = req.query;
      const factors = await elevationService.getFloodRiskFactors(parseFloat(lat as string), parseFloat(lng as string));

      if (!factors) {
        return res.status(404).json({
          success: false,
          message: 'Flood risk data not available for these coordinates'
        });
      }

      const vulnerability = elevationService.analyzeTerrainVulnerability(factors);

      res.json({
        success: true,
        data: {
          factors,
          vulnerability
        }
      });

    } catch (error: any) {
      logger.error('Error in flood risk factors route:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error analyzing flood risk factors'
      });
    }
  }
);

// =====================================
// OPENSTREETMAP API ROUTES
// =====================================

/**
 * @route GET /api/v1/external/osm/search
 * @desc Search for locations using Nominatim
 * @access Private
 */
router.get('/osm/search',
  [
    query('query').isString().trim().notEmpty().withMessage('Search query required'),
    query('limit').optional().isInt({ min: 1, max: 10 }).withMessage('Limit must be 1-10'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { query, limit = 5 } = req.query;
      const results = await openStreetMapService.searchLocations(query as string, parseInt(limit as string));

      res.json({
        success: true,
        data: results
      });

    } catch (error: any) {
      logger.error('Error in OSM search route:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error searching locations'
      });
    }
  }
);

/**
 * @route GET /api/v1/external/osm/infrastructure
 * @desc Get infrastructure data within bounding box
 * @access Private
 */
router.get('/osm/infrastructure',
  [
    query('minLat').isFloat({ min: -90, max: 90 }).withMessage('Valid minLat required'),
    query('minLng').isFloat({ min: -180, max: 180 }).withMessage('Valid minLng required'),
    query('maxLat').isFloat({ min: -90, max: 90 }).withMessage('Valid maxLat required'),
    query('maxLng').isFloat({ min: -180, max: 180 }).withMessage('Valid maxLng required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { minLat, minLng, maxLat, maxLng } = req.query;
      const infrastructure = await openStreetMapService.getInfrastructureData(
        parseFloat(minLat as string),
        parseFloat(minLng as string),
        parseFloat(maxLat as string),
        parseFloat(maxLng as string)
      );

      if (!infrastructure) {
        return res.status(404).json({
          success: false,
          message: 'Infrastructure data not available for this area'
        });
      }

      res.json({
        success: true,
        data: infrastructure
      });

    } catch (error: any) {
      logger.error('Error in OSM infrastructure route:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error getting infrastructure data'
      });
    }
  }
);

// =====================================
// VIETNAM GOVERNMENT API ROUTES
// =====================================

/**
 * @route GET /api/v1/external/vietnam/population
 * @desc Get population data
 * @access Private
 */
router.get('/vietnam/population',
  [
    query('level').optional().isIn(['province', 'district', 'ward']).withMessage('Invalid level'),
    query('year').optional().isInt({ min: 2000, max: 2030 }).withMessage('Invalid year'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { level = 'province', year = new Date().getFullYear() } = req.query;
      const data = await vietnamGovService.getPopulationData(level as 'province' | 'district' | 'ward', parseInt(year as string));

      res.json({
        success: true,
        data,
        metadata: {
          level,
          year,
          count: data.length,
          source: 'Vietnam Government Statistics'
        }
      });

    } catch (error: any) {
      logger.error('Error in population data route:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error getting population data'
      });
    }
  }
);

/**
 * @route GET /api/v1/external/vietnam/disasters
 * @desc Get disaster history data
 * @access Private
 */
router.get('/vietnam/disasters',
  [
    query('province').optional().isString().trim(),
    query('type').optional().isIn(['flood', 'storm', 'drought', 'landslide']).withMessage('Invalid disaster type'),
    query('startYear').optional().isInt({ min: 1900, max: 2030 }).withMessage('Invalid start year'),
    query('endYear').optional().isInt({ min: 1900, max: 2030 }).withMessage('Invalid end year'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { province, type, startYear, endYear } = req.query;
      const yearRange = startYear && endYear ? {
        start: parseInt(startYear as string),
        end: parseInt(endYear as string)
      } : undefined;

      const disasters = await vietnamGovService.getDisasterHistory(
        province as string,
        type as 'flood' | 'storm' | 'drought' | 'landslide',
        yearRange
      );

      res.json({
        success: true,
        data: disasters,
        metadata: {
          filter: { province, type, yearRange },
          count: disasters.length,
          source: 'Vietnam Central Committee for Flood and Storm Control'
        }
      });

    } catch (error: any) {
      logger.error('Error in disaster history route:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error getting disaster history'
      });
    }
  }
);

/**
 * @route GET /api/v1/external/vietnam/hydro
 * @desc Get hydrological monitoring data
 * @access Private
 */
router.get('/vietnam/hydro',
  [
    query('province').optional().isString().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { province } = req.query;
      const hydroData = await vietnamGovService.getHydroData(province as string);

      res.json({
        success: true,
        data: hydroData,
        metadata: {
          filter: { province },
          count: hydroData.length,
          source: 'Vietnam Hydro-Meteorological Service'
        }
      });

    } catch (error: any) {
      logger.error('Error in hydro data route:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error getting hydrological data'
      });
    }
  }
);

export default router;
